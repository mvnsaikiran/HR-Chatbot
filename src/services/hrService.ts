import { ai, MODELS } from './gemini';
import { db } from '../lib/firebase';
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, limit, getDocs,
  doc, setDoc, updateDoc, Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { ChatMessage, ChatSession, GeminiMessage, UserProfile } from '../types';

const SYSTEM_PROMPT = `
You are "Lumina," an elite AI-powered HR companion. You are warm, precise, and deeply knowledgeable about HR policy, employment law concepts, and employee wellbeing.

## Your Personality
- Empathetic first — validate before advising
- Concise — keep responses under 120 words unless the topic demands more
- Structured — use bullet points ("- ") for multi-step answers
- Honest — if uncertain, recommend reaching out to a human HR partner
- Proactive — always offer a logical next step or action

## Navigation
- /dashboard — home overview
- /leave — submit or track leave requests
- /profile — personal details

## HR Policies
- **Vacation**: 20 days/year. Carry-over: max 5 days.
- **Sick leave**: 10 days/year. No documentation under 3 days.
- **Personal leave**: 3 days/year.
- **Maternity**: 26 weeks paid.
- **Paternity**: 5 working days paid.
- **Working hours**: 9 AM – 6 PM Mon–Fri.
- **Remote work**: Up to 2 days/week with manager consent.
- **Performance reviews**: Quarterly. Scale: 1–5.
- **Grievances**: 100% confidential. 14-day resolution target.
- **PF**: 12% employee + 12% employer.
- **Gratuity**: After 5 years service.
- **ESI**: If CTC ≤ ₹21,000/month.

## Rules
- Never fabricate data or make legal promises
- Never discuss other employees
`.trim();

const MAX_CONTEXT_MESSAGES = 20;
const MAX_INPUT_CHARS = 2000;
const RATE_LIMIT_RPM = 10;
const INJECTION_PATTERNS = [
  /ignore (all |your )?(previous |prior |above )?instructions/i,
  /you are now/i,
  /disregard (your|the) (system|guidelines|rules)/i,
  /reveal (your |the )?(system |)prompt/i,
  /jailbreak/i,
];

const callTimestamps: number[] = [];

function checkRateLimit(): void {
  const now = Date.now();
  while (callTimestamps.length > 0 && now - callTimestamps[0] > 60_000) callTimestamps.shift();
  if (callTimestamps.length >= RATE_LIMIT_RPM) throw new Error(`Rate limit reached. Max ${RATE_LIMIT_RPM} questions per minute.`);
  callTimestamps.push(now);
}

function sanitiseInput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Message cannot be empty.');
  if (trimmed.length > MAX_INPUT_CHARS) throw new Error(`Message too long. Max ${MAX_INPUT_CHARS} characters.`);
  for (const p of INJECTION_PATTERNS) if (p.test(trimmed)) throw new Error("I can't process that request.");
  return trimmed;
}

function buildContextWindow(history: GeminiMessage[]): GeminiMessage[] {
  if (history.length <= MAX_CONTEXT_MESSAGES) return history;
  const sliced = history.slice(-MAX_CONTEXT_MESSAGES);
  const firstUser = sliced.findIndex(m => m.role === 'user');
  return firstUser > 0 ? sliced.slice(firstUser) : sliced;
}

export async function getAiResponse(
  userId: string,
  rawUserText: string,
  history: GeminiMessage[],
  userProfile?: UserProfile
) {
  checkRateLimit();
  sanitiseInput(rawUserText);
  const contextWindow = buildContextWindow(history);
  const userCtx = userProfile
    ? `\n\n## Current Employee\n- Name: ${userProfile.displayName}\n- Department: ${userProfile.department ?? 'General'}\n- Role: ${userProfile.role}`
    : '';

  return ai.models.generateContentStream({
    model: MODELS.FLASH,
    contents: contextWindow,
    config: {
      systemInstruction: SYSTEM_PROMPT + userCtx,
      temperature: 0.5,
      maxOutputTokens: 400,
    },
  });
}

export async function createSession(userId: string, firstMessage: string): Promise<string> {
  const title = firstMessage.length > 60 ? firstMessage.slice(0, 57) + '…' : firstMessage;
  const sessionRef = doc(collection(db, 'users', userId, 'chatSessions'));
  await setDoc(sessionRef, {
    userId, title,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    messageCount: 0,
  });
  return sessionRef.id;
}

async function touchSession(userId: string, sessionId: string, newCount: number): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId, 'chatSessions', sessionId), {
      lastMessageAt: serverTimestamp(), messageCount: newCount
    });
  } catch { }
}

export async function saveMessage(
  userId: string, sessionId: string, text: string,
  sender: 'user' | 'ai', sessionMessageCount: number
): Promise<string | null> {
  const payload = { userId, sessionId, text, sender, timestamp: serverTimestamp() };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ref = await addDoc(collection(db, 'users', userId, 'chatSessions', sessionId, 'messages'), payload);
      touchSession(userId, sessionId, sessionMessageCount + 1);
      return ref.id;
    } catch (err) {
      if (attempt === 2) return null;
      await new Promise(res => setTimeout(res, 200 * 2 ** attempt));
    }
  }
  return null;
}

export async function getChatHistory(userId: string, sessionId: string): Promise<ChatMessage[]> {
  try {
    const q = query(collection(db, 'users', userId, 'chatSessions', sessionId, 'messages'), orderBy('timestamp', 'asc'), limit(60));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, sessionId, ...d.data() } as ChatMessage));
  } catch { return []; }
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  try {
    const q = query(collection(db, 'users', userId, 'chatSessions'), orderBy('lastMessageAt', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
  } catch { return []; }
}

export async function deleteSession(userId: string, sessionId: string): Promise<void> {
  const q = query(collection(db, 'users', userId, 'chatSessions', sessionId, 'messages'), limit(500));
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'users', userId, 'chatSessions', sessionId));
  await batch.commit();
}

export function toMs(ts: ChatMessage['timestamp']): number {
  if (!ts) return Date.now();
  if (ts instanceof Timestamp) return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof (ts as any).seconds === 'number') return (ts as any).seconds * 1000;
  return Date.now();
}