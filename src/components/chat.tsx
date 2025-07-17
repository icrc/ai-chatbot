"use client";

import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { navigateTo } from "@ai-chatbot/lib/utils";
import { ChatHeader } from "@ai-chatbot/components/chat-header";
import { useArtifactSelector } from "@ai-chatbot/hooks/use-artifact";
import { type ChatSession, ChatStatus, type Vote } from "@ai-chatbot/lib/types";
import {
  ChatModeKeyOptions,
  type Source,
  type Message,
  type ChatMode,
  type Chat as ChatModel,
  type KnowledgeBaseKeyOptions,
  type LanguageModelKeyOptions,
} from "@ai-chatbot/app/api/models";
import {
  getChatMetadataAndMessages,
  stopStreamByChatId,
  streamAnswer,
} from "@ai-chatbot/app/api/route";
import { useCoreContext } from "@ai-chatbot/app/contexts/core-context";
import { toast } from "./toast";
import { Artifact } from "./artifact";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";

const initialChatSessionState: Omit<ChatSession, "localSessionId"> = {
  chat: undefined,
  messages: undefined,
  isLoadingMessages: false,
  loadingMessagesError: null,
  streamingAnswer: "",
  streamingChatId: null,
  isProcessingPrompt: false,
  processingPromptError: null,
  processingPromptInputValue: "",
  inputValue: "",
  shouldAutoScroll: false,
  hasSubmittedStopStream: false,
};

// FIXME
export interface ProcessPromptOptions {
  isRetry?: boolean;
}

export function Chat({
  id: chatId,
  initialMessages,
  initialChatMode,
  initialKnowledgeBase,
  initialLanguageModel,
  isReadonly,
  autoResume,
}: {
  id: string;
  initialMessages: Array<Message>;
  initialChatMode: ChatModeKeyOptions;
  initialKnowledgeBase?: KnowledgeBaseKeyOptions;
  initialLanguageModel?: LanguageModelKeyOptions;
  isReadonly: boolean;
  autoResume: boolean;
}) {
  const {
    chatModes,
    knowledgeBases,
    languageModels,
    currentKnowledgeBase,
    currentLanguageModel,
    setUserSuggestions,
    setCurrentKnowledgeBase,
    setCurrentLanguageModel,
  } = useCoreContext();

  const [status, setStatus] = useState<ChatStatus>(ChatStatus.Ready);
  const [input, setInput] = useState<string>("");
  const [currentChatSession, setCurrentChatSession] = useState<ChatSession>({
    ...initialChatSessionState,
    localSessionId: Date.now(),
  });
  const [previousChats, setPreviousChats] = useState<ChatModel[]>([]);
  const [currentChatMode, setCurrentChatMode] = useState<ChatMode>(
    chatModes.find((cm) => cm.key === initialChatMode) ?? chatModes[0]
  );

  // to check if request responses should be ignored
  const currentLocalSessionIdRef = useRef<number>(
    currentChatSession.localSessionId
  );

  useEffect(() => {
    if (initialKnowledgeBase && knowledgeBases)
      setCurrentKnowledgeBase(
        knowledgeBases.find((kb) => kb.key === initialKnowledgeBase)
      );

    if (initialLanguageModel && languageModels)
      setCurrentLanguageModel(
        languageModels.find((lm) => lm.key === initialLanguageModel)
      );
  }, []);

  const processPrompt = async (
    inputValue: string,
    options?: ProcessPromptOptions
  ) => {
    const { isRetry = false } = options || {};
    const localSessionId = currentLocalSessionIdRef.current;

    try {
      // initialize streaming state
      setCurrentChatSession((prev) => ({
        ...prev,
        isProcessingPrompt: true,
        processingPromptError: null,
        processingPromptInputValue: inputValue,
        inputValue: isRetry ? prev.inputValue : "", // keep current input text if retrying a failed prompt
        streamingAnswer: "", // reset streaming answer
        shouldAutoScroll: true, // enable auto-scroll on prompt submission
      }));

      // on stream handler to pass as param to stream answer from the API stream request
      const onStream = (chunk: string, chatId: string | null) => {
        // only process response if still on the same session, otherwise ignore
        if (localSessionId === currentLocalSessionIdRef.current) {
          setCurrentChatSession((prev) => ({
            ...prev,
            streamingAnswer: prev.streamingAnswer + chunk,
            streamingChatId: chatId,
          }));
        }
        // setStatus(ChatStatus.Streaming);
      };

      // start streaming answer and append streamed answer chunks
      const { userPrompt, finalAnswer, newChatId } = await streamAnswer(
        onStream,
        inputValue,
        currentChatMode.key,
        localSessionId,
        currentLocalSessionIdRef,
        currentChatSession.chat?.id ??
          (currentChatSession.streamingChatId as string), // if not provided, use the generated newChatId to save final streamed answer
        currentLanguageModel?.key,
        currentKnowledgeBase?.key
      );

      // only process response if still on the same session, otherwise ignore
      if (
        localSessionId === currentLocalSessionIdRef.current &&
        userPrompt &&
        finalAnswer
      ) {
        const chatIdFromStreamedAnswer =
          currentChatSession?.chat?.id || newChatId;

        if (!chatIdFromStreamedAnswer) {
          // setStatus(ChatStatus.Error);
          throw new Error(
            "Could not retrieve a valid chat identifier to process the prompt."
          );
        }

        // get updated metadata and messages (chat title, message source documents, etc.)
        const res = await getChatMetadataAndMessages(chatIdFromStreamedAnswer);

        if (localSessionId === currentLocalSessionIdRef.current) {
          if (!res?.id || !res?.messages?.length) {
            // setStatus(ChatStatus.Error);
            throw new Error(
              "Could not retrieve valid chat session data while processing the prompt."
            );
          }

          // render the saved chat/messages with any new generated metadata, e.g. title
          setCurrentChatSession((prev) => ({
            ...prev,
            chat: res,
            messages: res.messages,
            isProcessingPrompt: false,
            hasSubmittedStopStream: false,
            processingPromptInputValue: "",
            streamingChatId: res.id,
          }));

          // filter out the updated/new chat and unshift it as the first in the previous chat list
          setPreviousChats((prevChats) => {
            const filteredChats =
              prevChats?.filter?.((chat) => chat.id !== res.id) || [];
            return [res, ...filteredChats];
          });

          navigateTo(`/chat/${chatIdFromStreamedAnswer}`);
        }
      }
    } catch (err) {
      if (localSessionId === currentLocalSessionIdRef.current) {
        console.error(
          `Error while processing prompt: ${(err as Error).message}`
        );
        setCurrentChatSession((prev) => ({
          ...prev,
          isProcessingPrompt: false,
          hasSubmittedStopStream: false,
          processingPromptError: new Error(
            `Error while processing prompt: ${(err as Error).message}`
          ),
        }));
        // setStatus(ChatStatus.Error);
      }
    } finally {
      // setStatus(ChatStatus.Ready);
    }
  };

  // attempt to stop stream, BE should stop the current stream as soon as possible
  const stopCurrentStream = () => {
    const chatIdToStopStream =
      currentChatSession.chat?.id || currentChatSession.streamingChatId;

    if (chatIdToStopStream && currentChatSession.isProcessingPrompt) {
      setCurrentChatSession({
        ...currentChatSession,
        hasSubmittedStopStream: true,
      });
      stopStreamByChatId(chatIdToStopStream);
      // setStatus(ChatStatus.Ready);
    }
    // window._mtm = window._mtm || [];
    // window._mtm.push({
    //   event: "stopStreaming-click",
    // });
  };

  const openNewChatCreationMenu = () => {
    const newLocalSessionId = Date.now();
    setCurrentChatSession({
      ...initialChatSessionState,
      localSessionId: newLocalSessionId,
    });

    if (currentChatMode.key === ChatModeKeyOptions.Generic)
      return navigateTo(`/${currentChatMode.key}/${currentLanguageModel?.key}`);

    if (currentChatMode.key === ChatModeKeyOptions.Documents)
      return navigateTo(`/${currentChatMode.key}/${currentKnowledgeBase?.key}`);
  };

  // const searchParams = useSearchParams();
  // const query = searchParams.get("query");

  // const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  // useEffect(() => {
  //   if (query && !hasAppendedQuery) {
  //     setHasAppendedQuery(true);
  //     navigateTo(`/chat/${chatId}`);
  //   }
  // }, [query, hasAppendedQuery, chatId]);

  const { data: votes } = useSWR<Array<Vote>>(
    currentChatSession?.messages?.length &&
      currentChatSession.messages.length >= 2
      ? `/api/vote?chatId=${chatId}`
      : null
  );

  const [attachments, setAttachments] = useState<Array<[string, Source]>>([]);

  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useEffect(() => {
    if (chatId && !currentChatSession?.messages?.length) {
      getChatMetadataAndMessages(chatId).then((chatData) => {
        setCurrentChatSession((prev) => ({
          ...prev,
          chat: chatData,
          messages: chatData.messages,
          isProcessingPrompt: false,
          hasSubmittedStopStream: false,
          processingPromptInputValue: "",
        }));

        let sourcesEntries: [string, Source][] = [];
        chatData.messages.forEach((message) => {
          if (message?.sources) {
            const entries = Object.entries(
              message.sources as Record<number, Source>
            );
            sourcesEntries = [...entries];
          }
        });
        // console.info({ chatData, sourcesEntries });
      });
    }
  }, [chatId, currentChatSession?.messages, attachments]);

  const handleSubmit = async () => {
    // setStatus(ChatStatus.Submitted);

    await processPrompt(input);
  };

  const setMessages = (messages: Message[] | undefined) => {
    setCurrentChatSession((prevChatSession) => {
      return {
        ...prevChatSession,
        messages,
      };
    });
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          selectedChatMode={initialChatMode}
          isReadonly={isReadonly}
        />

        <Messages
          chatId={chatId}
          status={status}
          setStatus={setStatus}
          votes={votes}
          messages={currentChatSession?.messages as Message[]}
          reload={() => {
            return "";
          }}
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
              setStatus={setStatus}
              stop={stopCurrentStream}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={currentChatSession?.messages as Message[]}
              processPrompt={processPrompt}
              setMessages={setMessages}
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
        stop={stopCurrentStream}
        attachments={attachments}
        setAttachments={setAttachments}
        messages={currentChatSession?.messages as Message[]}
        reload={() => {
          return "";
        }}
        votes={votes}
        isReadonly={isReadonly}
        setMessages={setMessages}
        setStatus={setStatus}
      />
    </>
  );
}
