import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

// Helper to get key from various sources
const getApiKey = (): string => {
  // 1. Try process.env (injected by build or env var)
  if (process.env.API_KEY) return process.env.API_KEY;
  
  // 2. Try Local Storage (Manual entry in Electron/Web)
  const storedKey = localStorage.getItem('gemini_api_key');
  if (storedKey) return storedKey;
  
  throw new Error("No API Key found. Please sign in.");
};

const getClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = (modelId: string) => {
  const ai = getClient();
  return ai.chats.create({
    model: modelId,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });
};

export const sendMessageStream = async function* (
  chatInstance: Chat, 
  message: string
): AsyncGenerator<string, void, unknown> {
  try {
    const resultStream = await chatInstance.sendMessageStream({ message });
    
    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const generateTitle = async (firstMessage: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a very short (3-5 words) title for a conversation that starts with: "${firstMessage}". Do not use quotes.`,
    });
    return response.text?.trim() || "New Chat";
  } catch (e) {
    return "New Chat";
  }
};