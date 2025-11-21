import { ModelOption } from './types';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Fast and efficient for everyday tasks'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3.0 Pro',
    description: 'Complex reasoning and advanced coding'
  },
  {
    id: 'gemini-2.5-flash-thinking-preview-01-21',
    name: 'Gemini 2.5 Flash Thinking',
    description: 'Enhanced reasoning capabilities'
  }
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export const SYSTEM_INSTRUCTION = `You are Gemini, a helpful AI assistant accessed via a dedicated Windows-style desktop application. 
Format your responses using clear Markdown. Be concise and professional.`;
