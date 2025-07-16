"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCoreContext } from "@ai-chatbot/app/contexts/core-context";
import { Button } from "./ui/button";
import type { ProcessPromptOptions } from "./chat";

interface SuggestedActionsProps {
  processPrompt: (
    inputValue: string,
    options?: ProcessPromptOptions
  ) => Promise<void>;
}

function PureSuggestedActions({ processPrompt }: SuggestedActionsProps) {
  const { userSuggestions } = useCoreContext();
  const { t } = useTranslation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const displayLimit = 4;

  if (!Array.isArray(userSuggestions) || userSuggestions.length === 0) {
    return null;
  }

  /**
   * no need for rotation if examples are less than the display limit
   */
  const limit = Math.min(displayLimit, userSuggestions?.length);

  /**
   * Suggestions reload wrapped/circular rotation
   * If examples = ["a", "b", "c", "d", "e"] and displayLimit = 4:
   * - currentIndex = 0 => currentSuggestions = ["a", "b", "c", "d"]
   * - currentIndex = 4 => currentSuggestions = ["e", "a", "b", "c"]
   * - currentIndex = 3 => currentSuggestions = ["d", "e", "a", "b"]
   */
  const handleReload = () => {
    // increment index by the limit and wrap around with modulus
    setCurrentIndex(
      (prevIndex) => (prevIndex + limit) % userSuggestions.length
    );
  };

  /**
   * generate up to x limit suggestions, from currentIndex wrapping around circularly
   */
  const suggestedActions = Array.from({ length: limit }, (_, i) => {
    const index = (currentIndex + i) % userSuggestions.length; // calculate wrapped index
    return userSuggestions[index];
  });

  return (
    <div className="flex flex-col gap-4">
      <div
        data-testid="suggested-actions"
        className="grid sm:grid-cols-2 gap-2 w-full"
      >
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * index }}
            key={`suggested-action-${suggestedAction}-${index + 1}`}
            className={index > 1 ? "hidden sm:block" : "block"}
          >
            <Button
              variant="ghost"
              onClick={async () => {
                await processPrompt(suggestedAction);
              }}
              className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-full justify-start items-start overflow-hidden text-ellipsis text-balance"
            >
              <span className="font-medium">{suggestedAction}</span>

              {/*
               FIXME: not used for now
              <span className="text-muted-foreground">
                {suggestedAction.label}
              </span>
              */}
            </Button>
          </motion.div>
        ))}
      </div>
      <button
        className="flex flex-row gap-4 cursor-pointer underline items-center"
        type="button"
        onClick={handleReload}
      >
        <RefreshCcw size={16} />
        {t("chatLog.reloadSuggestions")}
      </button>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps !== nextProps) return false;

    return true;
  }
);
