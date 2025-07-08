"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { getChats, hideChat } from "@ai-chatbot/app/api/route";
import { ChatModeKeyOptions, type Chat } from "@ai-chatbot/app/api/models";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from "./ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { ChatItem } from "./sidebar-history-item";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export function SidebarHistory({ user }: { user: string | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { t } = useTranslation();
  const { id } = useParams();

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);

  const hasEmptyChatHistory = chatHistory ? chatHistory.length === 0 : false;

  useEffect(() => {
    // FIXME
    getChats(ChatModeKeyOptions.Documents).then((data) => {
      setChatHistory([...data]);
    });
  }, []);

  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats?.reduce(
      (groups, chat) => {
        if (isValidChat(chat)) {
          const chatDate = new Date(chat.created_at as string);

          if (isToday(chatDate)) {
            groups.today.push(chat);
          } else if (isYesterday(chatDate)) {
            groups.yesterday.push(chat);
          } else if (chatDate > oneWeekAgo) {
            groups.lastWeek.push(chat);
          } else if (chatDate > oneMonthAgo) {
            groups.lastMonth.push(chat);
          } else {
            groups.older.push(chat);
          }
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats
    );
  };

  const isValidChat = (chat: Chat) => {
    return Boolean(
      // FIXME
      // chat?.chat_mode_key === currentChatMode.key &&
      chat?.title && chat?.id && !chat?.hidden
    );
  };

  const handleDelete = async () => {
    if (deleteId) {
      toast.promise(hideChat(deleteId), {
        loading: t("toast.hidingChat"),
        success: () => {
          setChatHistory((prevChats) =>
            prevChats.map((c) =>
              c.id === deleteId ? { ...c, hidden: true } : c
            )
          );

          return t("toast.chatHiddenSuccessfully");
        },
        error: t("toast.failedToHideChat"),
        finally: () => {
          setShowDeleteDialog(false);

          if (deleteId === id) {
            router.push("/");
          }
        },
      });
    }
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            {t("sideBar.revisitPreviousChats")}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
          {t("sideBar.conversations.today")}
        </div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div
                key={item}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      "--skeleton-width": `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            {t("sideBar.noConversations")}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {chatHistory &&
              (() => {
                const groupedChats = groupChatsByDate(chatHistory);

                return (
                  <div className="flex flex-col gap-6">
                    {groupedChats.today.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          {t("sideBar.conversations.today")}
                        </div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId: string) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          {t("sideBar.conversations.yesterday")}
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId: string) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          {t("sideBar.conversations.lastSevenDays")}
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId: string) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          {t("sideBar.conversations.lastThirtyDays")}
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId: string) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.older.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          {t("sideBar.conversations.olderThanLastMonth")}
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId: string) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </SidebarMenu>
          <motion.div
            onViewportEnter={() => {
              // if (!isValidating && !hasReachedEnd) {
              //   setSize((size) => size + 1);
              // }
            }}
          />
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-8">
            {t("sideBar.conversations.reachedTheEndOfChatHistory")}
          </div>
          {/*
          With pagination
          <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center mt-8">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
            <div>{t("sideBar.conversations.reachedTheEndOfChatHistory")}</div>
          </div>
          */}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("alertDialog.deleteChatWarningTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("alertDialog.deleteChatWarningDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              {t("alertDialog.deleteChatWarningCancelButton")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="cursor-pointer">
              {t("alertDialog.deleteChatWarningContinueButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
