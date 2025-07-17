"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  memo,
  type ChangeEvent,
} from "react";
import cx from "classnames";
import { toast } from "sonner";
import equal from "fast-deep-equal";
import { ArrowDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UseChatHelpers } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { ChatStatus } from "@ai-chatbot/lib/types";
import type { Message, Source } from "@ai-chatbot/app/api/models";
import { useScrollToBottom } from "@ai-chatbot/hooks/use-scroll-to-bottom";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ArrowUpIcon, StopIcon } from "./icons";
import type { ProcessPromptOptions } from "./chat";
import { SuggestedActions } from "./suggested-actions";

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  setStatus,
  stop,
  attachments: sources,
  setAttachments,
  messages,
  processPrompt,
  setMessages,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  status: ChatStatus;
  setStatus: Dispatch<SetStateAction<ChatStatus>>;
  stop: () => void;
  attachments: Array<[string, Source]>;
  setAttachments: Dispatch<SetStateAction<Array<[string, Source]>>>;
  messages: Array<Message> | undefined;
  processPrompt: (
    inputValue: string,
    options?: ProcessPromptOptions
  ) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  handleSubmit: () => Promise<void>;
  className?: string;
}) {
  const { width } = useWindowSize();
  const { t } = useTranslation();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight + 2
      }px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = "98px";
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  // TODO: future implementation
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [shouldLoadSuggestions, setShouldLoadSuggestions] =
    useState<boolean>(true);

  useEffect(() => {
    // !chatId && !messages?.length && !sources.length && !uploadQueue.length;
    setShouldLoadSuggestions(!chatId && !messages?.length && !sources.length);
  }, [messages, sources]);

  const submitForm = useCallback(async () => {
    // await processPrompt(input);

    // window.history.replaceState({}, "", `/chat/${chatId}`);
    // navigateTo(`/chat/${chatId}`);

    // handleSubmit(undefined, {
    //   experimental_attachments: attachments,
    // });

    await handleSubmit();

    setAttachments([]);
    setLocalStorageInput("");
    resetHeight();
    // setStatus(ChatStatus.Submitted);
    setInput("");
    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    sources,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  // TODO: future implementation
  // const uploadFile = async (file: File) => {
  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     const response = await fetch("/api/files/upload", {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       const { url, pathname, contentType } = data;

  //       return {
  //         url,
  //         name: pathname,
  //         contentType: contentType,
  //       };
  //     }
  //     const { error } = await response.json();
  //     toast.error(error);
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   } catch (error) {
  //     toast.error("Failed to upload file, please try again!");
  //     console.error(error);
  //   }
  // };

  // const handleFileChange = useCallback(
  //   async (event: ChangeEvent<HTMLInputElement>) => {
  //     const files = Array.from(event.target.files || []);

  //     setUploadQueue(files.map((file) => file.name));

  //     try {
  //       const uploadPromises = files.map((file) => uploadFile(file));
  //       const uploadedAttachments = await Promise.all(uploadPromises);
  //       const successfullyUploadedAttachments = uploadedAttachments.filter(
  //         (attachment) => attachment !== undefined
  //       );

  //       // setAttachments((currentAttachments) => [
  //       //   ...currentAttachments,
  //       //   ...successfullyUploadedAttachments,
  //       // ]);
  //     } catch (error) {
  //       console.error("Error uploading files!", error);
  //     } finally {
  //       setUploadQueue([]);
  //     }
  //   },
  //   [setAttachments]
  // );

  const { isAtBottom, scrollToBottom } = useScrollToBottom();

  useEffect(() => {
    if (status === ChatStatus.Submitted) {
      scrollToBottom();
    }
  }, [status, scrollToBottom]);

  return (
    <div className="relative w-full flex flex-col gap-4 mt-3">
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute left-1/2 bottom-28 -translate-x-1/2 z-50"
          >
            <Button
              data-testid="scroll-to-bottom-button"
              className="rounded-full cursor-pointer"
              size="icon"
              variant="outline"
              onClick={(event) => {
                event.preventDefault();
                scrollToBottom();
              }}
            >
              <ArrowDown />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {shouldLoadSuggestions && (
        <SuggestedActions processPrompt={processPrompt} />
      )}

      {/* // TODO: future implementation
   <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(sources.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          // className="flex flex-row gap-2 overflow-x-scroll items-end"
          className="flex flex-row gap-2 items-end"
        >
          {sources.map(([key, src]) => (
            <PreviewAttachment key={key} attachment={src} />
          ))}

          FIXME 
          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                chunk_id: "",
                creation_date: "",
                file_name: filename,
                file_type: "",
                file_uri: "",
                last_ingestion_date: "",
                last_modified_date: "",
                page_label: "",
                platform_display_name: "",
                relevance: 0,
                text: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )} */}

      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder={t("promptInput.askMeSomething")}
        value={input}
        onChange={handleInput}
        className={cx(
          "min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700",
          className
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();

            if (status !== ChatStatus.Ready) {
              toast.error("Please wait for the model to finish its response!");
            } else {
              submitForm();
            }
          }
        }}
      />

      {/* 
      // TODO: future implementation
      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start">
        <AttachmentsButton fileInputRef={fileInputRef} status={status} />
      </div>
      */}

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {status === ChatStatus.Submitted ? (
          <StopButton
            stop={stop}
            messages={messages}
            setMessages={setMessages}
          />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={undefined}
          />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  }
);

// TODO: future implementation
// function PureAttachmentsButton({
//   fileInputRef,
//   status,
// }: {
//   fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
//   status: UseChatHelpers["status"];
// }) {
//   return (
//     <Button
//       data-testid="attachments-button"
//       className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
//       onClick={(event) => {
//         event.preventDefault();
//         fileInputRef.current?.click();
//       }}
//       disabled={status !== "ready"}
//       variant="ghost"
//     >
//       <PaperclipIcon size={14} />
//     </Button>
//   );
// }

// const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  messages,
  stop,
  setMessages,
}: {
  messages: Array<Message> | undefined;
  stop: () => void;
  setMessages: (messages: Message[]) => void;
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        if (messages) setMessages(messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  // FIXME
  uploadQueue: Array<string> | undefined;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 cursor-pointer"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={
        uploadQueue?.length ? uploadQueue.length > 0 : input.length === 0
      }
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue?.length !== nextProps.uploadQueue?.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
