'use client';

import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import { ChatModeKeyOptions } from '@ai-chatbot/app/api/models';
import { useSidebar } from './ui/sidebar';
import { SidebarToggle } from './sidebar-toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { BotIcon, FileIcon, LogoOpenAI, MetaIcon, PlusIcon } from './icons';
import { useTranslation } from 'react-i18next';
import { Dropdown } from './ui/dropdown';
import { useCoreContext } from '@ai-chatbot/app/core-context';

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
    knowledgeBases,
    languageModels,
    currentKnowledgeBase,
    currentLanguageModel,
    setCurrentKnowledgeBase,
    setCurrentLanguageModel,
  } = useCoreContext();

  const [chatMode, setChatMode] = useState(ChatModeKeyOptions.Generic);

  const handleChange = (event: string) => {
    setChatMode(event as ChatModeKeyOptions);
  };

  const handleKnowledgeBaseChange = (event: string) => {
    const selectedKey = event;

    if (selectedKey === currentKnowledgeBase?.key) return;

    const selectedKnowledgeBase = knowledgeBases?.find(
      (knowledgeBase) => knowledgeBase.key === selectedKey,
    );
    if (selectedKnowledgeBase) {
      setCurrentKnowledgeBase(selectedKnowledgeBase);
    }
  };

  const handleLanguageModelChange = (event: string) => {
    const selectedKey = event;

    if (selectedKey === currentLanguageModel?.key) return;

    const selectedLanguageModel = languageModels?.find(
      (languageModel) => languageModel.key === selectedKey,
    );
    if (selectedLanguageModel) {
      setCurrentLanguageModel(selectedLanguageModel);
    }
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
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">{t('sideBar.newChat')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('sideBar.newChat')}</TooltipContent>
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
          value={currentLanguageModel?.key || languageModels?.[0].key || ''}
          onChange={handleLanguageModelChange}
          options={languageModels}
          startIcon={<LogoOpenAI />}
        />
      )}

      {chatMode === ChatModeKeyOptions.Documents && (
        <Dropdown
          id="knowledge-base-dropdown"
          value={currentKnowledgeBase?.key || knowledgeBases?.[0].key || ''}
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
