
export interface RatioOption {
  key: string;
  label: string;
  ratio: { width: number; height: number };
}

export interface PromptTemplate {
  title: string;
  text: string;
}

export interface PromptTemplates {
  [key: string]: PromptTemplate[];
}

export interface VoiceData {
  name: string;
  gender: string;
  style: string;
  description: string;
}

export interface VeoPromptData {
    label: string;
    type: 'text' | 'select';
    placeholder?: string;
    options?: { value: string; label: string }[];
}

export interface VeoPromptConfig {
    [key: string]: VeoPromptData;
}

export interface User {
    username: string;
    password: string; // In a real app, never store plain text passwords
    role: 'admin' | 'user';
    expiryDate?: number | null; // Timestamp in milliseconds, null means permanent
}