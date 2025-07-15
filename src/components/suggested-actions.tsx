/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";
import { navigateTo } from "@ai-chatbot/lib/utils";
import { useCoreContext } from "@ai-chatbot/app/contexts/core-context";
import { Button } from "./ui/button";

interface SuggestedActionsProps {
  chatId: string;
}

function PureSuggestedActions({ chatId }: SuggestedActionsProps) {
  const { userSuggestions } = useCoreContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayLimit = 4;

  if (!Array.isArray(userSuggestions) || userSuggestions.length === 0) {
    return null;
  }

  // Suggestions reload wrapped/circular rotation
  // If examples = ["a", "b", "c", "d", "e"] and displayLimit = 4:
  // - currentIndex = 0 => currentSuggestions = ["a", "b", "c", "d"]
  // - currentIndex = 4 => currentSuggestions = ["e", "a", "b", "c"]
  // - currentIndex = 3 => currentSuggestions = ["d", "e", "a", "b"]

  // no need for rotation if examples are less than the display limit
  const limit = Math.min(displayLimit, userSuggestions.length);

  const handleReload = () => {
    // increment index by the limit and wrap around with modulus
    setCurrentIndex(
      (prevIndex) => (prevIndex + limit) % userSuggestions.length
    );
  };

  // generate up to x limit suggestions, from currentIndex wrapping around circularly
  const currentSuggestions = Array.from({ length: limit }, (_, i) => {
    const index = (currentIndex + i) % userSuggestions.length; // calculate wrapped index
    return userSuggestions[index];
  });

  console.info({ currentSuggestions });

  const suggestedActions = [
    {
      title: "What are the advantages",
      label: "of using Next.js?",
      action: "What are the advantages of using Next.js?",
    },
    {
      title: "Write code to",
      label: `demonstrate djikstra's algorithm`,
      action: `Write code to demonstrate djikstra's algorithm`,
    },
    {
      title: "Help me write an essay",
      label: `about silicon valley`,
      action: `Help me write an essay about silicon valley`,
    },
    {
      title: "What is the weather",
      label: "in San Francisco?",
      action: "What is the weather in San Francisco?",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div
        data-testid="suggested-actions"
        className="grid sm:grid-cols-2 gap-2 w-full"
      >
        {currentSuggestions.map((suggestedAction, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * index }}
            key={`suggested-action-${suggestedAction}-${index}`}
            // key={`suggested-action-${suggestedAction.title}-${index}`}
            className={index > 1 ? "hidden sm:block" : "block"}
          >
            <Button
              variant="ghost"
              onClick={async () => {
                navigateTo(`/chat/${chatId}`);
              }}
              className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
            >
              <span className="font-medium">{suggestedAction}</span>
              {/* <span className="font-medium">{suggestedAction.title}</span> */}
              {/* <span className="text-muted-foreground">
              {suggestedAction.label}
            </span> */}
            </Button>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-row gap-4">
        Reload
        <RefreshCcw />
      </div>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;

    return true;
  }
);
