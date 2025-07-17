import { type Dispatch, memo, type SetStateAction } from "react";
import equal from "fast-deep-equal";
import { motion } from "framer-motion";
import { ChatStatus, type Vote } from "@ai-chatbot/lib/types";
import { useMessages } from "@ai-chatbot/hooks/use-messages";
import { MessageRoles, type Message } from "@ai-chatbot/app/api/models";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

interface MessagesProps {
  chatId: string;
  status: ChatStatus;
  setStatus: Dispatch<SetStateAction<ChatStatus>>;
  votes: Array<Vote> | undefined;
  messages: Array<Message> | undefined;
  reload: any;
  isReadonly: boolean;
  isArtifactVisible: boolean;
}

function PureMessages({
  chatId,
  status,
  setStatus,
  votes,
  messages,
  reload,
  isReadonly,
}: MessagesProps) {
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
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
    >
      {!messages?.length && <Greeting />}

      {messages?.map((message, index) => (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
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

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages?.length !== nextProps.messages?.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
