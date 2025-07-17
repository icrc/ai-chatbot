import { Chat } from "@ai-chatbot/components/chat";
import { DataStreamHandler } from "@ai-chatbot/components/data-stream-handler";
import { ChatModeKeyOptions } from "../api/models";

export default async function Documents() {
  const id = "";
  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatMode={ChatModeKeyOptions.Documents}
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
