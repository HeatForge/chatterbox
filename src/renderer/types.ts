export interface Project {
  id: string;
  name: string;
  summary: string;
  connectors: string[];
}

export interface Chat {
  id: string;
  name: string;
  parentId: string | null;
  hidden: boolean;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  attachments?: string[];
  siblings?: string[];
  activeSiblingIndex?: number;
}

export interface SamplerSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  presencePenalty: number;
}

export interface ToolsConfig {
  webSearch: boolean;
  codeInterpreter: boolean;
  vectorRag: boolean;
}
