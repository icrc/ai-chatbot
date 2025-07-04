import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { Chat } from "@ai-chatbot/components/chat";
import { ChatModeKeyOptions } from "@ai-chatbot/app/api/models";
import { DataStreamHandler } from "@ai-chatbot/components/data-stream-handler";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  if (!id) return redirect("/", RedirectType.push);

  const [cookieStore] = await Promise.all([cookies()]);
  const modelIdFromCookie = cookieStore.get("chat-mode")
    ?.value as ChatModeKeyOptions;
  const DEFAULT_CHAT_MODEL: ChatModeKeyOptions = ChatModeKeyOptions.Generic;

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          isReadonly={false}
          autoResume={true}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie}
        isReadonly={false}
        autoResume={true}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
