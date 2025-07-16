import { Chat } from "@ai-chatbot/components/chat";
import {
  ChatModeKeyOptions,
  KnowledgeBaseKeyOptions,
} from "@ai-chatbot/app/api/models";
import { DataStreamHandler } from "@ai-chatbot/components/data-stream-handler";

export default async function Health() {
  const id = "";
  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatMode={ChatModeKeyOptions.Documents}
        initialKnowledgeBase={KnowledgeBaseKeyOptions.Health}
        isReadonly={false}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
