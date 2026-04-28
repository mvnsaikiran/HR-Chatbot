import { Timestamp } from 'firebase/firestore';

// ─── Auth / User ──────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'employee';
export type UserStatus = 'active' | 'on_leave' | 'terminated';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  department?: string;
  managerId?: string;
  joinDate?: string;
  status: UserStatus;
}

// ─── Leave ────────────────────────────────────────────────────────────────────
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  reason?: string;
  managerComments?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export type MessageSender = 'user' | 'ai';

/**
 * Firestore returns Timestamps for server-written fields,
 * but optimistic local messages use a plain Date.
 * Using this union eliminates the `any` type while handling both cases.
 */
export type FirestoreTimestamp = Timestamp | Date;

export interface ChatMessage {
  id: string;
  userId: string;
  sessionId: string;           // groups messages into discrete conversations
  text: string;
  sender: MessageSender;
  timestamp: FirestoreTimestamp;
  tokenCount?: number;         // stored after AI replies for context budget tracking
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;               // auto-generated from first user message
  createdAt: FirestoreTimestamp;
  lastMessageAt: FirestoreTimestamp;
  messageCount: number;
}

// ─── Gemini history format ────────────────────────────────────────────────────
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
