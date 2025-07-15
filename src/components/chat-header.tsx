"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import { useTranslation } from "react-i18next";
import { navigateTo } from "@ai-chatbot/lib/utils";
import { ChatModeKeyOptions } from "@ai-chatbot/app/api/models";
import { useCoreContext } from "@ai-chatbot/app/contexts/core-context";
import { Button } from "./ui/button";
import { Dropdown } from "./ui/dropdown";
import { useSidebar } from "./ui/sidebar";
import { SidebarToggle } from "./sidebar-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { BotIcon, FileIcon, LogoOpenAI, MetaIcon, PlusIcon } from "./icons";

function PureChatHeader({
  selectedModeId,
  isReadonly,
}: {
  selectedModeId: ChatModeKeyOptions;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { t } = useTranslation();

  const { width: windowWidth } = useWindowSize();

  const {
    chatModes,
    currentKnowledgeBase,
    currentLanguageModel,
    currentLanguageType,
    currentTheme,
    isOpenUserSettings,
    knowledgeBases,
    languageModels,
    selectedLanguage,
    touValid,
    user,
    userSettings,

    setCurrentKnowledgeBase,
    setCurrentLanguageModel,
    setCurrentLanguageType,
    setCurrentTheme,
    setIsOpenUserSettings,
    setSelectedLanguage,
    setTouValid,
    setUserSettings,
  } = useCoreContext();

  const [chatMode, setChatMode] = useState(ChatModeKeyOptions.Generic);

  const handleChange = (event: string) => {
    setChatMode(event as ChatModeKeyOptions);
  };

  const handleKnowledgeBaseChange = (event: string) => {
    const selectedKey = event;

    if (selectedKey === currentKnowledgeBase?.key) return;

    const selectedKnowledgeBase = knowledgeBases?.find(
      (knowledgeBase) => knowledgeBase.key === selectedKey
    );
    if (selectedKnowledgeBase) {
      setCurrentKnowledgeBase(selectedKnowledgeBase);
      // if (!location.pathname.includes(selectedKnowledgeBase.key))
      // navigateTo(`/${currentChatMode.key}/${selectedKnowledgeBase?.key}`);
    }
  };

  const handleLanguageModelChange = (event: string) => {
    const selectedKey = event;

    if (selectedKey === currentLanguageModel?.key) return;

    const selectedLanguageModel = languageModels?.find(
      (languageModel) => languageModel.key === selectedKey
    );
    if (selectedLanguageModel) {
      setCurrentLanguageModel(selectedLanguageModel);
      // if (!location.pathname.includes(selectedLanguageModel.key))
      //   navigateTo(`/${currentChatMode.key}/${selectedLanguageModel?.key}`);
    }
  };

  // const handleChatModeChange = (event?: any) => {
  //   const selectedKey =
  //     (event?.target.value as ChatModeKeyOptions) ??
  //     routingData?.incomingChatMode;

  //   if (selectedKey === currentChatMode.key) return;

  //   const selectedChatMode = chatModes.find(
  //     (chatMode) => chatMode.key === selectedKey
  //   );
  //   if (selectedChatMode) {
  //     handleSelectedChatMode(selectedChatMode);
  //     if (!location.pathname.includes(selectedChatMode.key))
  //       navigateTo(`/${selectedChatMode.key}`);
  //   }
  // };

  const openNewChatCreationMenu = () => {
    const newLocalSessionId = Date.now();
    router.push("/");
    // if (currentChatMode.key === ChatModeKeyOptions.Generic)
    //   return navigateTo(`/${currentChatMode.key}/${currentLanguageModel?.key}`);

    // if (currentChatMode.key === ChatModeKeyOptions.Documents)
    //   return navigateTo(`/${currentChatMode.key}/${currentKnowledgeBase?.key}`);
  };

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={openNewChatCreationMenu}
            >
              <PlusIcon />
              <span className="md:sr-only">{t("general.newChat")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("general.newChat")}</TooltipContent>
        </Tooltip>
      )}
      <Dropdown
        id="chat-mode-dropdown"
        value={chatMode}
        onChange={handleChange}
        options={chatModes}
        startIcon={
          chatMode === ChatModeKeyOptions.Generic ? <BotIcon /> : <FileIcon />
        }
      />

      {chatMode === ChatModeKeyOptions.Generic && (
        <Dropdown
          id="language-model-dropdown"
          value={currentLanguageModel?.key || languageModels?.[0].key || ""}
          onChange={handleLanguageModelChange}
          options={languageModels}
          startIcon={<LogoOpenAI />}
        />
      )}

      {chatMode === ChatModeKeyOptions.Documents && (
        <Dropdown
          id="knowledge-base-dropdown"
          value={currentKnowledgeBase?.key || knowledgeBases?.[0].key || ""}
          onChange={handleKnowledgeBaseChange}
          options={knowledgeBases}
          startIcon={<MetaIcon />}
        />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModeId === nextProps.selectedModeId;
});
