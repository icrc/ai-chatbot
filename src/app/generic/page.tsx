import { Chat } from "@ai-chatbot/components/chat";
import { DataStreamHandler } from "@ai-chatbot/components/data-stream-handler";
import { ChatModeKeyOptions } from "../api/models";

export default async function Generic() {
  const id = "";
  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatMode={ChatModeKeyOptions.Generic}
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
