import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage, Role } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

// Singleton-like pattern for the AI client, initialized lazily or reused
let aiClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!aiClient) {
    // Using process.env.API_KEY directly as per guidelines
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
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