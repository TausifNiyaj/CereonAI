
export type Role = 'user' | 'model';

export type AppView = 'chat' | 'images' | 'projects' | 'coding' | 'settings';

export interface ChatMessage {
  role: Role;
  text: string;
  isError?: boolean;
  groundingUrls?: string[];
  imageUrl?: string;
}

export interface GeminiResponse {
  text: string;
  groundingUrls: string[];
}

export interface ImageResponse {
  imageUrl: string;
  prompt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
  projectId?: string;
}
