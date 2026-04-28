/**
 * Firebase Cloud Function — Gemini API Proxy
 *
 * PURPOSE:
 *   Keeps the Gemini API key server-side. The frontend calls this function
 *   with the conversation history; this function forwards it to Gemini and
 *   streams the response back.
 *
 * DEPLOY:
 *   1. cd functions && npm install
 *   2. firebase functions:secrets:set GEMINI_API_KEY
 *   3. firebase deploy --only functions
 *
 * USAGE FROM FRONTEND (replace direct Gemini SDK calls with):
 *   const res = await fetch('https://<region>-<project>.cloudfunctions.net/geminiProxy', {
 *     method: 'POST',
 *     headers: { 'Authorization': `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ messages, systemInstruction, userContext }),
 *   });
 */

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenAI } from '@google/genai';
import * as admin from 'firebase-admin';

admin.initializeApp();

const GEMINI_KEY = defineSecret('GEMINI_API_KEY');

// ─── Rate limiting ─────────────────────────────────────────────────────────────
/** Simple in-memory rate limiter (per Cloud Function instance). */
const callLog = new Map<string, number[]>();
const RPM_LIMIT = 15;

function isRateLimited(uid: string): boolean {
  const now = Date.now();
  const timestamps = (callLog.get(uid) ?? []).filter(t => now - t < 60_000);
  if (timestamps.length >= RPM_LIMIT) return true;
  callLog.set(uid, [...timestamps, now]);
  return false;
}

// ─── Injection guard ──────────────────────────────────────────────────────────
const INJECTION_RE = [
  /ignore (all |your )?(previous |prior |above )?instructions/i,
  /you are now/i,
  /disregard (your|the) (system|guidelines|rules)/i,
  /reveal (your |the )?(system |)prompt/i,
  /jailbreak/i,
  /DAN mode/i,
];

function hasInjection(text: string): boolean {
  return INJECTION_RE.some(re => re.test(text));
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export const geminiProxy = onRequest(
  { secrets: [GEMINI_KEY], cors: true, invoker: 'private' },
  async (req, res) => {
    // 1. Auth check
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) { res.status(401).json({ error: 'Unauthorized' }); return; }

    let uid: string;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch {
      res.status(401).json({ error: 'Invalid token' }); return;
    }

    // 2. Rate limit
    if (isRateLimited(uid)) {
      res.status(429).json({ error: `Rate limit: max ${RPM_LIMIT} requests/minute.` }); return;
    }

    // 3. Validate body
    const { messages, systemInstruction } = req.body as {
      messages: { role: string; parts: { text: string }[] }[];
      systemInstruction: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' }); return;
    }

    // 4. Injection check on the last user message
    const lastUserText = messages.filter(m => m.role === 'user').pop()?.parts[0]?.text ?? '';
    if (hasInjection(lastUserText)) {
      res.status(400).json({ error: "I can't process that request." }); return;
    }

    // 5. Call Gemini (non-streaming for Cloud Function simplicity)
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_KEY.value() });
      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: messages,
        config: { systemInstruction, temperature: 0.5, maxOutputTokens: 400 },
      });

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      res.json({ text });
    } catch (err: any) {
      console.error('Gemini error:', err);
      res.status(500).json({ error: 'AI service error. Please try again.' });
    }
  }
);
