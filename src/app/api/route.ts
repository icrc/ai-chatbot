import { getAuthToken } from "@ai-chatbot/auth/use-auth-config";
import {
    type ApiUserSettings,
    type Chat,
    type ChatMetadataAndMessages,
    ChatModeKeyOptions,
    type HideChatResponse,
    type LanguageType,
    type Message,
    type MessageFeedbackOptions,
    type SendChatMessageFeedbackResponse,
    type StreamAnswerRequestBody,
    type StreamAnswerResponse,
    type User
} from "./models";

declare global {
    interface Window {
        _mtm: any[];
    }
}

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
let _correlationId = "";

/* API endpoints & actions */
const Endpoints = {
    Health: `${BASE_URL}/health`,
    User: {
        Upsert: `${BASE_URL}/user-service/user`,
        TOUUpdate: (version: string) =>
            `${BASE_URL}/user-service/user/tou/${encodeURIComponent(version)}`,
        UserSettings: `${BASE_URL}/user-service/user/settings`,
        UpdateUserSettings: `${BASE_URL}/user-service/user/settings`,
        LanguageType: `${BASE_URL}/user-service/user/tou/language`,
    },
    Chat: {
        Mode: (chatModeKey?: string) =>
            `${BASE_URL}/chat-service/chat/mode/${chatModeKey ?? ''}`,
        ById: (chatId: string) => `${BASE_URL}/chat-service/chat/id/${chatId}`,
        Hide: (chatId: string) =>
            `${BASE_URL}/chat-service/chat/hide/${chatId}`,
        Stream: `${BASE_URL}/chat-service/chat/stream/start`,
        StopStream: (chatId: string) =>
            `${BASE_URL}/chat-service/chat/stream/stop/${chatId}`,
    },
    Message: {
        FeedbackUpdate: `${BASE_URL}/chat-service/message/feedback`,
    },
};

function buildHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
        apikey: API_KEY,
    };
}

async function request<T>(
    method: 'GET' | 'POST' | 'PATCH',
    url: string,
    payload?: any,
): Promise<T> {
    try {
        const options: RequestInit = {
            method,
            headers: buildHeaders(),
            mode: 'cors',
        };

        if (method !== 'GET' && payload) {
            options.body = JSON.stringify(payload);
        }

        const response = await fetch(url, options);

        setCorrelationId(getCorrelationIdFromHeaders(response.headers));

        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }

        // parse without .json() since it triggers a known checkmarx false positive for a backend recommendation (HSTS header)
        const parsedResponse: T = JSON.parse(await response.text());

        return parsedResponse;
    } catch (exception) {
        throw new Error(`An error occurred during the request: ${exception}`);
    }
}

async function get<T>(url: string): Promise<T> {
    return await request<T>('GET', url);
}

async function post<T>(url: string, payload?: any): Promise<T> {
    return await request<T>('POST', url, payload);
}

async function patch<T>(url: string, payload?: any): Promise<T> {
    return await request<T>('PATCH', url, payload);
}

function buildUrlWithParams(
    baseUrl: string,
    params: Record<string, any> = {},
): string {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            queryParams.append(key, String(value));
        }
    }

    return queryParams.toString() ? `${baseUrl}?${queryParams}` : baseUrl;
}

function getChatByIdQueryParams(
    overrides: Partial<Record<string, any>> = {},
): Record<string, any> {
    const defaultParams = {
        with_chat: true,
        with_messages: false,
    };
    return { ...defaultParams, ...overrides };
}

/**
 * Gets the correlation ID from the response headers.
 * @param headers Response headers.
 * @returns The correlation ID.
 */
function getCorrelationIdFromHeaders(headers: Headers): string {
    return headers.get('x-correlation-id')?.toString() ?? '';
}

/**
   * Sets the correlation ID.
   * @param id The id as a string.
   */
function setCorrelationId(id: string): void {
    _correlationId = id;
}

export async function getHealth() {
    return await post<any>(Endpoints.Health);
}

/**
 * Gets the Correlation ID.
 * @returns The correlation ID.
 */
export function getCorrelationId(): string {
    return _correlationId;
}

// create and/or retrieve a User
export async function postUser(): Promise<User> {
    return await post<User>(Endpoints.User.Upsert);
}

// accept terms of use
export async function postTOU(version: string): Promise<string> {
    return await post<string>(Endpoints.User.TOUUpdate(version));
}

/**
 * Gets the User Settings.
 * @returns Promise to get the User Settings.
 */
export async function getUserSettings(): Promise<ApiUserSettings> {
    return await get<ApiUserSettings>(Endpoints.User.UserSettings);
}

/**
 * Sets the User Settings.
 * @param payload The proposed payload for User Settings.
 * @returns Promise to post the User Settings.
 */
export async function postUserSettings(
    payload: ApiUserSettings,
): Promise<ApiUserSettings> {
    return await post<ApiUserSettings>(
        Endpoints.User.UpdateUserSettings,
        payload,
    );
}

// sets the chosen language
export async function postLanguageType(
    payload?: LanguageType,
): Promise<LanguageType> {
    return await post<LanguageType>(
        Endpoints.User.LanguageType,
        payload,
    );
}

// get list of previous chat sessions (just the metadata, with title, etc.)
export async function getChats(
    chatModeKey?: ChatModeKeyOptions,
): Promise<Chat[]> {
    return await get<Chat[]>(Endpoints.Chat.Mode(chatModeKey));
}

// get all messages of an existing chat session without the chat metadata (already fetched for previous chats list)
export async function getChatMessages(chatId: string): Promise<Message[]> {
    const url = buildUrlWithParams(
        Endpoints.Chat.ById(chatId),
        getChatByIdQueryParams({ with_chat: false, with_messages: true }),
    );
    return await get<Message[]>(url);
}

// get all messages of a chat session, along with its metadata
export async function getChatMetadataAndMessages(
    chatId: string,
): Promise<ChatMetadataAndMessages> {
    const url = buildUrlWithParams(
        Endpoints.Chat.ById(chatId),
        getChatByIdQueryParams({ with_chat: true, with_messages: true }),
    );
    return await get<ChatMetadataAndMessages>(url);
}

// send feedback to a chat message
export async function sendChatMessageFeedback(
    messageId: string,
    userFeedback: MessageFeedbackOptions,
    commentFeedback?: string,
): Promise<SendChatMessageFeedbackResponse> {
    const payload = {
        message_id: messageId,
        feedback: userFeedback,
        comment_feedback: commentFeedback,
    };
    return await patch<SendChatMessageFeedbackResponse>(
        Endpoints.Message.FeedbackUpdate,
        payload,
    );
}

// hide a chat
export async function hideChat(chatId: string): Promise<HideChatResponse> {
    return await patch<HideChatResponse>(Endpoints.Chat.Hide(chatId));
}

// stream an answer for a user prompt
export async function streamAnswer(
    onStream: (chunk: string, chatId: string | null) => void,
    userPrompt: string,
    chatModeKey: ChatModeKeyOptions,
    localSessionId: number,
    currentLocalSessionIdRef: React.MutableRefObject<number>,
    chatId?: string,
    languageModelKey?: string,
    knowledgeBaseKey?: string,
): Promise<StreamAnswerResponse> {
    const abortController = new AbortController();
    const signal = abortController.signal;

    try {
        const payload: StreamAnswerRequestBody = {
            chat_id: chatId ?? null,
            user_prompt: userPrompt,
            chat_mode_key: chatModeKey,
            language_model_key:
                chatModeKey === ChatModeKeyOptions.Generic ? languageModelKey : '',
            knowledge_base_key:
                chatModeKey === ChatModeKeyOptions.Documents ? knowledgeBaseKey : '',
        };

        const response = await fetch(Endpoints.Chat.Stream, {
            method: 'POST',
            headers: buildHeaders(),
            mode: 'cors',
            body: JSON.stringify(payload),
            signal,
        });

        setCorrelationId(getCorrelationIdFromHeaders(response.headers));

        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }

        // extract new chat ID from response headers
        // should exist if we didnt pass any chat id (means we're streaming an answer for a new chat)
        const newChatId = response.headers.get('chat_id');

        // start streaming answer chunks
        const reader = response.body?.getReader?.();
        const decoder = new TextDecoder('utf-8');
        let accumulatedAnswer = '';

        if (reader) {
            let done = false;
            while (!done) {
                // signal streaming disconnect to backend if there's a change in session id during ongoing stream
                if (currentLocalSessionIdRef.current !== localSessionId) {
                    abortController.abort();

                    return {
                        userPrompt,
                        finalAnswer: accumulatedAnswer,
                        newChatId,
                    };
                }

                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                const chunk = decoder.decode(value, { stream: true });
                accumulatedAnswer += chunk;
                onStream(chunk, newChatId);
                if (done === true) {
                    window._mtm = window._mtm || [];
                    window._mtm.push({
                        event: 'answer-complete',
                    });
                }
            }
        }
        return {
            userPrompt,
            finalAnswer: accumulatedAnswer,
            newChatId,
        };
    } catch (exception) {
        throw new Error(`An error occurred while streaming data: ${exception}`);
    }
}

// attempt to stop an ongoing streaming answer of a given chat
export async function stopStreamByChatId(
    chatId: string,
): Promise<string | null> {
    return await post<string | null>(Endpoints.Chat.StopStream(chatId));
}