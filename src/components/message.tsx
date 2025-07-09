"use client";

import {
  type Dispatch,
  Fragment,
  type JSX,
  memo,
  type SetStateAction,
  useState,
} from "react";
import cx from "classnames";
import { AnimatePresence, motion } from "framer-motion";
import equal from "fast-deep-equal";
import type { UseChatHelpers } from "@ai-sdk/react";
import { cn } from "@ai-chatbot/lib/utils";
import {
  MessageRoles,
  SourceFileTypes,
  type Message,
  type Source,
} from "@ai-chatbot/app/api/models";
import { FileIcon, PencilEditIcon, SparklesIcon } from "./icons";
import { MessageActions } from "./message-actions";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { MessageEditor } from "./message-editor";
import { MessageReasoning } from "./message-reasoning";
import { DocumentToolCall, DocumentToolResult } from "./document";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import { DocumentPreview } from "./document-preview";
import { useTranslation } from "react-i18next";
import { FileMode } from "@ai-chatbot/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import {
  ChevronDownIcon,
  DownloadIcon,
  ExternalLink,
  GlobeIcon,
  RouteIcon,
  ShareIcon,
} from "lucide-react";

const PurePreviewMessage = ({
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: Message;
  vote: any | undefined;
  isLoading: boolean;
  setMessages: Dispatch<SetStateAction<Message[]>>;
  reload: UseChatHelpers["reload"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const { t } = useTranslation();

  const [mode, setMode] = useState<FileMode>(FileMode.View);
  const sourcesEntries: [string, Source][] = Object.entries(
    message?.sources as Record<number, Source>
  );

  const getFileTypeLogoSrc = (fileType: string): string => {
    const fileTypeLogoMap: { [key: string]: string } = {
      [SourceFileTypes.Pdf]: "../../pdf-file-logo.svg",
      [SourceFileTypes.Docx]: "../../docx-file-logo.svg",
      [SourceFileTypes.Txt]: "../../txt-file-logo.svg",
    };

    return fileTypeLogoMap[fileType] || "../../unknown-file-logo.svg";
  };

  const renderMetadata = (source: Source) => {
    const metadataItems: JSX.Element[] = [];

    // temporarily hide relevance score metadata
    // metadataItems.push(
    //   <span key="metadata-relevance">
    //     Relevance: {Math.floor(source.relevance)}%
    //   </span>
    // );

    // format date to d/m/yyyy
    const date = new Date(source.last_modified_date);
    const isValidDate = !Number.isNaN(date?.getTime?.());

    if (isValidDate) {
      const formattedDate = `${date.getDate()}/${
        date.getMonth() + 1
      }/${date.getFullYear()}`;
      metadataItems.push(
        <span key="metadata-date">
          {t("chatLog.lastUpdatedOn")} {formattedDate}
        </span>
      );
    }

    if (source.page_label) {
      metadataItems.push(
        <span key="metadata-page">
          {t("chatLog.page")} {source.page_label}
        </span>
      );
    }

    return (
      <span className="flex gap-2 dark:text-[#a7b2be] text-[#2675b5] text-[0.8125rem] mb-3 font-bold">
        {metadataItems.map((item, index) => (
          <Fragment key={item.key}>
            {index > 0 && (
              <span
                className="dark:text-[#a7b2be] text-[#2675b5] text-[0.8125rem] not-italic font-bold leading-4"
                aria-hidden="true"
              >
                {"|"}
              </span>
            )}
            {item}
          </Fragment>
        ))}
      </span>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl",
            {
              "w-full": mode === FileMode.Edit,
              "group-data-[role=user]/message:w-fit": mode !== FileMode.Edit,
            }
          )}
        >
          {message.role === MessageRoles.Assistant && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div
            className={cn("flex flex-col gap-4 w-full", {
              "min-h-96":
                message.role === MessageRoles.Assistant &&
                requiresScrollPadding,
            })}
          >
            {message.content && message.content.length > 0 && (
              <div
                key={`message-${message.id}`}
                className="flex flex-row gap-2 items-end justify-end"
              >
                {/* TODO: this feature might not be available at the end */}
                {/* 
                {message.role === MessageRoles.User && !isReadonly && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid="message-edit-button"
                        variant="ghost"
                        className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                        onClick={() => {
                          setMode(FileMode.Edit);
                        }}
                      >
                        <PencilEditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit message</TooltipContent>
                  </Tooltip>
                )}
                 */}

                <div
                  data-testid="message-content"
                  className={cn("flex flex-col max-w-full gap-4", {
                    "bg-primary text-primary-foreground px-3 py-2 rounded-xl":
                      message.role === MessageRoles.User,
                  })}
                >
                  <Markdown>{message.content}</Markdown>
                </div>
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
                isLoading={isLoading}
              />
            )}

            {message.role === MessageRoles.Assistant && (
              <Accordion
                type="single"
                collapsible
                dir="ltr"
                orientation="vertical"
                className="rounded-md bg-sidebar shadow-[0_2px_10px] shadow-black/5"
              >
                <AccordionItem
                  value="documents"
                  className="mt-px overflow-hidden first:mt-0 first:rounded-t last:rounded-b focus-within:relative focus-within:z-10 focus-within:shadow-[0_0_0_2px] focus-within:shadow-mauve12"
                >
                  <AccordionHeader>
                    <AccordionTrigger className="w-full flex flex-row group h-[45px] text-xl font-semibold items-center justify-between px-5 shadow-[0_1px_0] outline-none cursor-pointer">
                      <div className="flex flex-row gap-2 items-center">
                        <FileIcon />
                        <h1>{t("chatLog.sourceDocuments")}</h1>
                      </div>
                      <ChevronDownIcon
                        className="transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180"
                        size={36}
                        aria-hidden
                      />
                    </AccordionTrigger>
                  </AccordionHeader>
                  <AccordionContent className="overflow-hidden text-[15px] data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                    <div className="px-5 py-[15px]">
                      {sourcesEntries?.length > 0 &&
                        message.role === MessageRoles.Assistant && (
                          <div
                            data-testid={`message-attachments`}
                            className="flex flex-col justify-start gap-2"
                          >
                            {sourcesEntries.map(([key, source]) => (
                              <div
                                className="not-first:border-t-1 border-solid dark:border-[#d3d8de] border-[#454d54]"
                                key={key}
                                role="region"
                                aria-labelledby={`source-document-${key}`}
                              >
                                <div className="flex flex-col p-4">
                                  <a
                                    href={source.file_uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={source.file_name}
                                  >
                                    <div className="flex items-center mb-4">
                                      <img
                                        className="h-6 no-underline cursor-pointer mr-2"
                                        src={getFileTypeLogoSrc(
                                          source.file_type
                                        )}
                                        alt="File type"
                                        aria-hidden="true"
                                      />
                                      <span className="no-underline dark:text-[#d4e7f7] text-[#005ba4] font-semibold">
                                        {source.file_name}
                                      </span>
                                    </div>
                                  </a>
                                  <span
                                    id={`source-document-${key}`}
                                    className="text-[0.8125rem] mb-2"
                                  >
                                    <Markdown>{source.text}</Markdown>
                                  </span>
                                  {renderMetadata(source)}
                                  <div className="flex justify-between items-center">
                                    <a
                                      className="flex justify-start items-center cursor-pointer text-[0.8125rem] not-italic font-bold leading-6 px-2 py-1 underline underline-offset-[0.25rem] dark:text-[#d4e7f7] text-[#005ba4]"
                                      href={source.file_uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={
                                        source.platform_display_name
                                          ? `${t("chatLog.viewIn")} ${
                                              source.platform_display_name
                                            }`
                                          : t("chatLog.viewOriginalFile")
                                      }
                                    >
                                      {source.platform_display_name
                                        ? `${t("chatLog.viewIn")} ${
                                            source.platform_display_name
                                          }`
                                        : t("chatLog.viewOriginalFile")}
                                      <ExternalLink
                                        className="ml-2 no-underline dark:text-[#d4e7f7] text-[#005ba4]"
                                        aria-label={
                                          source.platform_display_name
                                            ? `${t("chatLog.viewIn")} ${
                                                source.platform_display_name
                                              }`
                                            : t("chatLog.viewOriginalFile")
                                        }
                                      />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.id !== nextProps.message.id) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  }
);

export const ThinkingMessage = () => {
  const { t } = useTranslation();
  const role = MessageRoles.Assistant;

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          }
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            {t("chatLog.thinkingPrompt")}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
