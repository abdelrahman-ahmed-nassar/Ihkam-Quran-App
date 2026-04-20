"use client";

import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  invokePwaInstallPrompt,
  isRunningAsInstalledPwa,
  subscribeBeforeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "../lib/pwa-install-prompt";

type InstallPWAButtonProps = {
  className?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
};

export function InstallPWAButton({
  variant,
  size,
}: InstallPWAButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isRunningAsInstalledPwa()) return;

    return subscribeBeforeInstallPrompt((promptEvent) => {
      setDeferredPrompt(promptEvent);
      setVisible(true);
    });
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    const choice = await invokePwaInstallPrompt(deferredPrompt);

    if (choice.outcome === "accepted") {
      console.log("PWA installed");
    }

    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Button
      type="button"
      onClick={installApp}
      size={size ?? "lg"}
      variant={variant}
    >
      <Download data-icon="inline-start" />
      تثبيت التطبيق
    </Button>
  );
}
