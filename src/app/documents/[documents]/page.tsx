"use client";

import { usePathname } from "next/navigation";
import {
  ChatModeKeyOptions,
  type KnowledgeBaseKeyOptions,
} from "@ai-chatbot/app/api/models";
import { Chat } from "@ai-chatbot/components/chat";
import { DataStreamHandler } from "@ai-chatbot/components/data-stream-handler";

export default function  DocumentsDynamicPage() {
  const pathname = usePathname();
  const id = "";

  const initialKnowledgeBase = pathname.split(
    `/${ChatModeKeyOptions.Documents}/`
  )[1] as KnowledgeBaseKeyOptions;

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatMode={ChatModeKeyOptions.Documents}
        initialKnowledgeBase={initialKnowledgeBase}
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
