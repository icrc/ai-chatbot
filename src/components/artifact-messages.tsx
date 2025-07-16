import { memo } from "react";
import equal from "fast-deep-equal";
import { motion } from "framer-motion";
import type { UseChatHelpers } from "@ai-sdk/react";
import { useMessages } from "@ai-chatbot/hooks/use-messages";
import { MessageRoles, type Message } from "@ai-chatbot/app/api/models";
import { ChatStatus, type Vote } from "@ai-chatbot/lib/types";
import { PreviewMessage, ThinkingMessage } from "./message";

interface ArtifactMessagesProps {
  chatId: string;
  status: ChatStatus;
  votes: Array<Vote> | undefined;
  messages: Array<Message> | undefined;
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  artifactStatus: ChatStatus;
}

function PureArtifactMessages({
  chatId,
  status,
  votes,
  messages,
  reload,
  isReadonly,
}: ArtifactMessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages?.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={
            (status === ChatStatus.Streaming &&
              index === (messages?.length && messages.length - 1)) ??
            false
          }
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          reload={reload}
          isReadonly={isReadonly}
          requiresScrollPadding={
            (hasSentMessage &&
              index === (messages?.length && messages.length - 1)) ??
            false
          }
        />
      ))}

      {status === ChatStatus.Submitted &&
        messages?.length &&
        messages.length > 0 &&
        messages[messages.length - 1].role === MessageRoles.User && (
          <ThinkingMessage />
        )}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>
  );
}

function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps
) {
  if (
    prevProps.artifactStatus === ChatStatus.Streaming &&
    nextProps.artifactStatus === ChatStatus.Streaming
  )
    return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages?.length !== nextProps.messages?.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
