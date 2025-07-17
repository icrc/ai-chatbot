"use client";

import { usePathname } from "next/navigation";
import {
  ChatModeKeyOptions,
  type LanguageModelKeyOptions,
} from "@ai-chatbot/app/api/models";
import { Chat } from "@ai-chatbot/components/chat";
import { DataStreamHandler } from "@ai-chatbot/components/data-stream-handler";

export default function GenericDynamicPage() {
  const pathname = usePathname();
  const id = "";

  const initialLanguageModel = pathname.split(
    `/${ChatModeKeyOptions.Generic}/`
  )[1] as LanguageModelKeyOptions;

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatMode={ChatModeKeyOptions.Generic}
        initialLanguageModel={initialLanguageModel}
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
