import type { Chat, Message } from "@ai-chatbot/app/api/models";

export type DataPart = { type: 'append-message'; message: string };

export type Document = {
  id: string;
  createdAt: Date;
  title: string;
  userId: string;
  content: string | null;
  kind: 'text' | 'code' | 'image' | 'sheet';
};

export type Suggestion = {
  documentId: string;
  id: string;
  createdAt: Date;
  userId: string;
  documentCreatedAt: Date;
  originalText: string;
  suggestedText: string;
  description: string | null;
  isResolved: boolean;
};

export type Vote = {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
};

export type UserType = 'guest' | 'regular';

export interface User {
  id?: string;
  email?: string | null;
  type: UserType;
}

type ISODateString = string;

interface DefaultSession {
  user?: User;
  expires: ISODateString;
}

export interface Session extends DefaultSession {
  user: {
    id: string;
    type: UserType;
  } & DefaultSession['user'];
}

export enum FileMode {
  View = "view",
  Edit = "edit",
} 

export interface ChatSession {
  chat?: Chat; // chat metadata loaded from the API
  messages?: Message[]; // chat messages loaded from the API
  isLoadingMessages: boolean;
  loadingMessagesError: Error | null;
  streamingAnswer: string;
  streamingChatId: string | null;
  isProcessingPrompt: boolean;
  processingPromptError: Error | null;
  processingPromptInputValue: string;
  inputValue: string;
  shouldAutoScroll: boolean;
  localSessionId: number; // local id to check if request responses should be ignored
  hasSubmittedStopStream: boolean;
}

export enum ChatStatus {
  Submitted = "submitted",
  Streaming = "streaming",
  Ready = "ready",
  Error = "error",
}