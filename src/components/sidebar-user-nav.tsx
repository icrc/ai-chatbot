"use client";

import { useEffect, useState } from "react";
import i18next from "i18next";
import { useTheme } from "next-themes";
import { ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getOAuthUserName } from "@ai-chatbot/auth/use-auth-config";
import {
  type ThemeTypeOptions,
  themeTypes,
  useCoreContext,
} from "@ai-chatbot/app/contexts/core-context";
import {
  type ApiUserSettings,
  type ChatMode,
  type ChatModeKeyOptions,
  type KnowledgeBase,
  KnowledgeBaseKeyOptions,
  LanguageKeyOptions,
  type LanguageModel,
  type LanguageOption,
  type UserLanguageOption,
} from "@ai-chatbot/app/api/models";
import { toast } from "./toast";
import {
  CheckCircleFillIcon,
  CogWheelIcon,
  CrossIcon,
  InfoIcon,
  LoaderIcon,
  WarningIcon,
} from "./icons";
import { Avatar } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import {
  GenericDialog,
  GenericDialogAction,
  GenericDialogContent,
  GenericDialogDescription,
  GenericDialogFooter,
  GenericDialogHeader,
  GenericDialogTitle,
} from "./ui/generic-dialog";
import { Button } from "./ui/button";
import { Dropdown } from "./ui/dropdown";
import { postUserSettings } from "@ai-chatbot/app/api/route";

export const languageTypes: LanguageOption[] = [
  {
    key: LanguageKeyOptions.English,
    display_name: "English",
  },
  {
    key: LanguageKeyOptions.Espanol,
    display_name: "Español",
  },
  {
    key: LanguageKeyOptions.Francais,
    display_name: "Français",
  },
];

export function SidebarUserNav({ user }: { user: any }) {
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
    setCurrentKnowledgeBase,
    setCurrentLanguageModel,
    setCurrentLanguageType,
    setCurrentTheme,
    setIsOpenUserSettings,
    setSelectedLanguage,
    setTouValid,
    setUserSettings,
    setUserSuggestions,
    touValid,
    // user,
    userSettings,
    userSuggestions,
  } = useCoreContext();
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();

  console.info({ userSettings });

  /*
   * when this settings menu mounts, capture the current settings into two states:
   * initialSettings to compare later, tempSettings is used
   * to store temporary preference changes to save to the backend.
   */
  const [initialSettings, setInitialSettings] = useState({
    languageType: userSettings?.defaultLanguage || currentLanguageType,
    theme: userSettings?.defaultTheme || currentTheme,
    // FIXME: remove last cases after current props are working properly
    chatMode: userSettings?.defaultChatMode || chatModes[0],
    knowledgeBase: userSettings?.defaultKnowledgeBase || currentKnowledgeBase,
    languageModel: userSettings?.defaultLanguageModel || currentLanguageModel,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [tempSettings, setTempSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // compute whether any of the temporary selections differ from the initial ones.
  const settingsChanged =
    JSON.stringify(tempSettings) !== JSON.stringify(initialSettings);

  const userName = getOAuthUserName();

  useEffect(() => {
    if (userName) setIsLoading(false);
    if (userSettings) {
      const settings = {
        chatMode: userSettings.defaultChatMode,
        knowledgeBase: userSettings.defaultKnowledgeBase,
        languageModel: userSettings.defaultLanguageModel,
        languageType: userSettings.defaultLanguage,
        theme: userSettings.defaultTheme,
      };
      setInitialSettings(settings);
      setTempSettings(settings);
    }
  }, [userName, userSettings]);

  const closeModal = () => {
    setSaveError(false);
    setSaveSuccess(false);
    setIsSaving(false);
    setTempSettings(initialSettings);
    setIsSettingsModalOpen(false);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveError(false);
    setSaveSuccess(false);

    const userSettingsData: ApiUserSettings = {
      default_chat_mode: tempSettings?.chatMode?.key,
      default_knowledge_base: tempSettings?.knowledgeBase?.key as string,
      default_model: tempSettings?.languageModel?.key as string,
      language: tempSettings?.languageType?.key as string,
      theme: tempSettings?.theme?.key as string,
    };

    try {
      await postUserSettings(userSettingsData).then((settingsData) => {
        const defaultChatMode = chatModes.find(
          (cm) => cm.key === settingsData.default_chat_mode
        ) as ChatMode;
        const defaultKnowledgeBase = knowledgeBases?.find(
          (kb) => kb.key === settingsData.default_knowledge_base
        ) as KnowledgeBase;
        const defaultLanguage = languageTypes.find(
          (lt) => lt.key === settingsData.language
        ) as UserLanguageOption;
        const defaultLanguageModel = languageModels?.find(
          (lm) => lm.key === settingsData.default_model
        ) as LanguageModel;
        const defaultTheme = themeTypes.find(
          (tt) => tt.key === settingsData.theme
        ) as ThemeTypeOptions;

        setUserSettings({
          defaultChatMode,
          defaultKnowledgeBase,
          defaultLanguage,
          defaultLanguageModel,
          defaultTheme,
        });

        if (
          defaultLanguage &&
          defaultLanguage.key !== initialSettings.languageType?.key
        ) {
          setCurrentLanguageType(defaultLanguage);
          i18next.changeLanguage(defaultLanguage.key);
          setSelectedLanguage(defaultLanguage.key);
        }

        if (defaultTheme && defaultTheme.key !== initialSettings.theme?.key) {
          setCurrentTheme(defaultTheme);
          // toggleTheme(settingsData.defaultTheme.key);
          setTheme(defaultTheme.key);
        }

        if (
          defaultChatMode &&
          defaultChatMode.key !== initialSettings.chatMode?.key
        ) {
          // handleSelectedChatMode(defaultChatMode);
        }

        if (
          defaultKnowledgeBase &&
          defaultKnowledgeBase.key !== initialSettings.knowledgeBase?.key
        ) {
          setCurrentKnowledgeBase(defaultKnowledgeBase);
        }

        if (
          defaultLanguageModel &&
          defaultLanguageModel.key !== initialSettings.languageModel?.key
        ) {
          setCurrentLanguageModel(defaultLanguageModel);
        }

        // after a successful save, update the initial settings to disable the save changes button
        setInitialSettings({
          chatMode: defaultChatMode,
          knowledgeBase: defaultKnowledgeBase,
          languageModel: defaultLanguageModel,
          languageType: defaultLanguage,
          theme: defaultTheme,
        });
      });
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageTypeChange = (event: string) => {
    const selectedKey = event;
    const selectedLanguage = languageTypes?.find(
      (language) => language.key === selectedKey
    );
    if (selectedLanguage) {
      setTempSettings((prev) => ({ ...prev, languageType: selectedLanguage }));
    }
  };

  const handleThemeChange = (event: string) => {
    const selectedKey = event;
    const selectedTheme = themeTypes?.find(
      (theme: ThemeTypeOptions) => theme.key === selectedKey
    );
    if (selectedTheme) {
      setTempSettings((prev) => ({ ...prev, theme: selectedTheme }));
    }
  };

  const handleChatModeChange = (event: string) => {
    const selectedKey = event as ChatModeKeyOptions;
    const selectedChatMode = chatModes.find(
      (chatMode) => chatMode.key === selectedKey
    );
    if (selectedChatMode) {
      setTempSettings((prev) => ({ ...prev, chatMode: selectedChatMode }));
    }
  };

  const handleKnowledgeBaseChange = (event: string) => {
    const selectedKey = event;
    const selectedKnowledgeBase = knowledgeBases?.find(
      (knowledgeBase) => knowledgeBase.key === selectedKey
    );
    if (selectedKnowledgeBase) {
      setTempSettings((prev) => ({
        ...prev,
        knowledgeBase: selectedKnowledgeBase,
      }));
    }
  };

  const handleModelChange = (event: string) => {
    const selectedKey = event;
    const selectedLanguageModel = languageModels?.find(
      (languageModel) => languageModel.key === selectedKey
    );
    if (selectedLanguageModel) {
      setTempSettings((prev) => ({
        ...prev,
        languageModel: selectedLanguageModel,
      }));
    }
  };

  return (
    <SidebarMenu>
      <GenericDialog
        open={isSettingsModalOpen}
        onOpenChange={() => {
          console.info("onOpenChange");
        }}
      >
        <GenericDialogContent>
          <GenericDialogHeader className="flex flex-row justify-between">
            <div className="flex flex-col">
              <GenericDialogTitle>
                {t("userSettingsDialog.settingsTitle")}
              </GenericDialogTitle>
              <GenericDialogDescription>
                {t("userSettingsDialog.settingsDescription")}
              </GenericDialogDescription>
            </div>
            <Button
              className="cursor-pointer bg-transparent dark:text-white text-black hover:bg-accent"
              onClick={closeModal}
            >
              <CrossIcon />
            </Button>
          </GenericDialogHeader>
          <>
            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t("userSettingsDialog.language")}
                </h1>
                <p>{t("userSettingsDialog.selectLanguage")}</p>
              </div>
              <Dropdown
                id="language-setting-dropdown"
                value={tempSettings.languageType?.key || ""}
                onChange={handleLanguageTypeChange}
                options={languageTypes}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">{t("userSettingsDialog.theme")}</h1>
                <p>{t("userSettingsDialog.selectTheme")}</p>
              </div>
              <Dropdown
                id="theme-setting-dropdown"
                value={tempSettings.theme?.key || ""}
                onChange={handleThemeChange}
                options={themeTypes}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t("userSettingsDialog.defaultChatMode")}
                </h1>
                <p>{t("userSettingsDialog.defaultChatModeDescription")}</p>
              </div>
              <Dropdown
                id="default-chat-mode-settings-dropdown"
                value={tempSettings.chatMode?.key || ""}
                onChange={handleChatModeChange}
                options={chatModes}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t("userSettingsDialog.knowledgeBase")}
                </h1>
                <p>{t("userSettingsDialog.selectKnowledgeBase")}</p>
              </div>
              <Dropdown
                id="knowledge-base-setting-dropdown"
                value={tempSettings.knowledgeBase?.key || ""}
                onChange={handleKnowledgeBaseChange}
                options={knowledgeBases}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t("userSettingsDialog.defaultGPTModel")}
                </h1>
                <p>{t("userSettingsDialog.differentGPTModels")}</p>
              </div>
              <Dropdown
                id="language-model-setting-dropdown"
                value={tempSettings.languageModel?.key || ""}
                onChange={handleModelChange}
                options={languageModels}
              />
            </div>
          </>
          <GenericDialogFooter className="justify-between items-center">
            <div className="flex items-center text-sm gap-1">
              {(saveSuccess || saveError) && (
                <>
                  {saveSuccess && (
                    <>
                      <CheckCircleFillIcon />
                      {t("userSettingsDialog.saveSuccess")}
                    </>
                  )}
                  {saveError && (
                    <>
                      <WarningIcon />
                      {t("userSettingsDialog.saveError")}
                    </>
                  )}
                </>
              )}
            </div>

            <GenericDialogAction
              className="flex items-center text-sm gap-1 cursor-pointer"
              disabled={!settingsChanged || isSaving}
              onClick={handleSaveChanges}
            >
              {isSaving
                ? t("userSettingsDialog.savingChanges")
                : t("userSettingsDialog.saveChanges")}
            </GenericDialogAction>
          </GenericDialogFooter>
        </GenericDialogContent>
      </GenericDialog>

      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoading ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    {t("sideBar.sideMenu.loadingAuthStatus")}
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 cursor-pointer"
              >
                <Avatar />
                <span data-testid="user-email" className="truncate">
                  {user?.email || userName}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[var(--radix-popper-anchor-width)]"
          >
            <DropdownMenuItem asChild data-testid="user-nav-item-settings">
              <div className="flex flex-row justify-start">
                <CogWheelIcon />
                <button
                  type="button"
                  className="w-full cursor-pointer text-left"
                  onClick={() => {
                    if (isLoading) {
                      toast({
                        type: "error",
                        description:
                          "Checking authentication status, please try again!",
                      });

                      return;
                    }

                    setIsSettingsModalOpen(true);
                  }}
                >
                  {t("sideBar.sideMenu.settings")}
                </button>
              </div>
            </DropdownMenuItem>

            {/* ########################################################## */}
            <DropdownMenuSeparator />
            {/* ########################################################## */}

            <DropdownMenuItem asChild data-testid="user-nav-item-documentation">
              <div className="flex flex-row">
                <InfoIcon />
                <a
                  href="/docs"
                  role="menuitem"
                  target="_blank"
                  className="w-full cursor-pointer text-left"
                  rel="noopener noreferrer"
                >
                  {t("sideBar.sideMenu.documentation")}
                </a>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
