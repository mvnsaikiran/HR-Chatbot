import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = (process.env.GEMINI_API_KEY ?? '') as string;

if (!apiKey && import.meta.env.DEV) {
  console.warn('[Lumina] GEMINI_API_KEY is not set.');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const MODELS = {
  FLASH: 'gemini-1.5-flash',
  FLASH_LITE: 'gemini-1.5-flash',
} as const;

export type ModelName = (typeof MODELS)[keyof typeof MODELS];

export async function streamChat(
  messages: { role: 'user' | 'model'; parts: { text: string }[] }[],
  systemInstruction: string
) {
  const model = genAI.getGenerativeModel({
    model: MODELS.FLASH,
    systemInstruction,
  });

  const history = messages.slice(0, -1);
  const lastMessage = messages[messages.length - 1];

  const chat = model.startChat({
    history,
    generationConfig: { temperature: 0.5, maxOutputTokens: 400 },
  });

  const result = await chat.sendMessageStream(
    lastMessage.parts.map(p => p.text).join('')
  );

  return result.stream;
}