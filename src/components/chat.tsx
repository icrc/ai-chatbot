"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import useSWR, { useSWRConfig } from "swr";
import { useSearchParams } from "next/navigation";
import { ChatHeader } from "@ai-chatbot/components/chat-header";
import { fetchWithErrorHandlers, generateUUID } from "@ai-chatbot/lib/utils";
import { useArtifactSelector } from "@ai-chatbot/hooks/use-artifact";
import { ChatSDKError } from "@ai-chatbot/lib/errors";
import type { Vote } from "@ai-chatbot/lib/types";
import {
  MessageRoles,
  type Source,
  type ChatModeKeyOptions,
  type Message,
} from "@ai-chatbot/app/api/models";
import { toast } from "./toast";
import { Artifact } from "./artifact";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatMetadataAndMessages } from "@ai-chatbot/app/api/route";

export function Chat({
  id: chatId,
  initialMessages,
  initialChatModel,
  isReadonly,
  autoResume,
}: {
  id: string;
  initialMessages: Array<Message>;
  initialChatModel: ChatModeKeyOptions;
  isReadonly: boolean;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();
  const [apiMessages, setApiMessages] = useState<Message[]>([]);

  const {
    // messages,
    // setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id: chatId,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id: chatId,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
    }),
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: "error",
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: MessageRoles.User,
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, "", `/chat/${chatId}`);
    }
  }, [query, append, hasAppendedQuery, chatId]);

  const { data: votes } = useSWR<Array<Vote>>(
    apiMessages.length >= 2 ? `/api/vote?chatId=${chatId}` : null
  );

  const [attachments, setAttachments] = useState<Array<[string, Source]>>([]);

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useEffect(() => {
    if (chatId && !apiMessages.length) {
      getChatMetadataAndMessages(chatId).then((chatData) => {
        setApiMessages(chatData.messages);

        let sourcesEntries: [string, Source][] = [];
        chatData.messages.forEach((message) => {
          if (message?.sources) {
            const entries = Object.entries(
              message.sources as Record<number, Source>
            );
            sourcesEntries = [...entries];
          }
        });
        setAttachments(sourcesEntries);
        console.info({ chatData, sourcesEntries });
      });
    }
  }, [chatId, apiMessages, attachments]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader selectedModeId={initialChatModel} isReadonly={isReadonly} />

        <Messages
          chatId={chatId}
          status={status}
          votes={votes}
          messages={apiMessages}
          setMessages={setApiMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={chatId}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={apiMessages}
              setMessages={setApiMessages}
              append={append}
            />
          )}
        </form>
      </div>

      <Artifact
        chatId={chatId}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={apiMessages}
        setMessages={setApiMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
