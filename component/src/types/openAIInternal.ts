import {OpenAIMessage} from './openAI';

export interface OpenAIInternalBody {
  model: string;
  systemMessage?: {role: 'system'; content: string}; // only for chat
  messages?: OpenAIMessage[]; // only for chat
  max_tokens?: number; // number of tokens to reply - recommended to be set by the client
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
}

export interface OpenAIInternal {
  chat: OpenAIInternalBody;
  completions: OpenAIInternalBody;
}
