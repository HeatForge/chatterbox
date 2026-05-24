import { Project, Chat, Message } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Chatterbox Spec & Dev',
    summary:
      'Building a rich-featured local electron client utilizing RAG and OpenRouter APIs.',
    connectors: ['/home/user/Coding/chatterbox', 'github.com/chatterbox/app'],
  },
  {
    id: 'p2',
    name: 'Marketing Engine RAG',
    summary:
      'Managing copywriting workflows and querying marketing documents folder.',
    connectors: ['/home/user/Documents/MarketingPlans'],
  },
];

export const INITIAL_CHATS: Chat[] = [
  {
    id: 'c1',
    name: 'OpenRouter & API Client Setup',
    parentId: null,
    hidden: false,
  },
  {
    id: 'c1-fork-1',
    name: '↳ Fork: Local Ollama Fallback',
    parentId: 'c1',
    hidden: false,
  },
  {
    id: 'c1-fork-2',
    name: '↳ Fork: Anthropic Direct Connectors',
    parentId: 'c1',
    hidden: false,
  },
  {
    id: 'c2',
    name: 'RAG Pipeline Architecture',
    parentId: null,
    hidden: false,
  },
  {
    id: 'c2-fork-1',
    name: '↳ Fork: HNSWLib Indexing',
    parentId: 'c2',
    hidden: false,
  },
  {
    id: 'c3',
    name: 'Glassmorphism Theme Details',
    parentId: null,
    hidden: false,
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  c1: [
    {
      id: 'm1',
      sender: 'user',
      content:
        'I want to integrate OpenRouter with connection retry logic. How should we set up the provider client?',
    },
    {
      id: 'm2',
      sender: 'assistant',
      content:
        'Here is the recommended connection configuration for OpenRouter. We can use a custom Axios instance or the official SDK with backoff retries.',
      siblings: [
        'Here is the recommended connection configuration for OpenRouter. We can use a custom Axios instance or the official SDK with backoff retries.',
        'Alternative response: We could also implement a local proxy server in the Electron main process to handle all API keys securely and handle rates/retries before sending data to the renderer.',
        'Third variant: A clean way to handle this is exposing a main-process IPC route like "openrouter:send-request" that handles the fetch call with retries and streams the text back via webContents.',
      ],
      activeSiblingIndex: 0,
    },
  ],
  'c1-fork-1': [
    {
      id: 'm1_f1',
      sender: 'user',
      content:
        'How should we configure Ollama fallback if OpenRouter is offline?',
    },
    {
      id: 'm2_f1',
      sender: 'assistant',
      content:
        'We can build a ProviderManager class that automatically catches connection errors. If an error is caught and a local Ollama service is detected running on http://127.0.0.1:11434, it falls back seamlessly.',
      siblings: [
        'We can build a ProviderManager class that automatically catches connection errors. If an error is caught and a local Ollama service is detected running on http://127.0.0.1:11434, it falls back seamlessly.',
      ],
      activeSiblingIndex: 0,
    },
  ],
  c2: [
    {
      id: 'm3',
      sender: 'user',
      content:
        'What embeddings model should we use for local document indexing?',
    },
    {
      id: 'm4',
      sender: 'assistant',
      content:
        'For fully local execution, a light sentence-transformers model like all-MiniLM-L6-v2 via transformers.js is standard and runs smoothly inside Electron helper processes. If internet is available, we can also use Cohere or OpenAI embeddings.',
      siblings: [
        'For fully local execution, a light sentence-transformers model like all-MiniLM-L6-v2 via transformers.js is standard and runs smoothly inside Electron helper processes. If internet is available, we can also use Cohere or OpenAI embeddings.',
      ],
      activeSiblingIndex: 0,
    },
  ],
};

export const PROVIDERS = [
  'OpenRouter',
  'Anthropic Direct',
  'OpenAI Direct',
  'Ollama Local',
];

export const MODELS_MAP: Record<string, string[]> = {
  OpenRouter: [
    'anthropic/claude-3.5-sonnet',
    'google/gemini-2.5-pro',
    'meta/llama-3.1-405b',
    'deepseek/deepseek-chat',
  ],
  'Anthropic Direct': [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-5-haiku-20241022',
  ],
  'OpenAI Direct': ['gpt-4o', 'gpt-4-turbo', 'o1-preview'],
  'Ollama Local': [
    'llama3:8b',
    'mistral:latest',
    'qwen2.5-coder:7b',
    'phi3:latest',
  ],
};
