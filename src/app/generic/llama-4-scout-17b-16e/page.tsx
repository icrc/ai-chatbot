import {
  ChatModeKeyOptions,
  LanguageModelKeyOptions,
} from "@ai-chatbot/app/api/models";
import { Chat } from "@ai-chatbot/components/chat";
import { DataStreamHandler } from "@ai-chatbot/components/data-stream-handler";

export default async function Llama4() {
  const id = "";
  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatMode={ChatModeKeyOptions.Generic}
        initialLanguageModel={LanguageModelKeyOptions.Llama_4}
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
