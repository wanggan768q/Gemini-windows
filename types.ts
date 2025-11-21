export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: number;
  model: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

// Mapping for icons or UI logic if needed
export enum AppView {
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}