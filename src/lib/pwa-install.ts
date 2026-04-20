/**
 * Chromium-style PWA install flow (`beforeinstallprompt`). Safari uses a different model.
 */

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isRunningAsInstalledPwa(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia?.("(display-mode: standalone)");
  if (mm?.matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function subscribeBeforeInstallPrompt(
  onPrompt: (event: BeforeInstallPromptEvent) => void,
): () => void {
  const handler = (event: Event) => {
    const promptEvent = event as BeforeInstallPromptEvent;
    promptEvent.preventDefault();
    onPrompt(promptEvent);
  };

  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}

export async function invokePwaInstallPrompt(
  deferred: BeforeInstallPromptEvent,
): Promise<{ outcome: "accepted" | "dismissed"; platform: string }> {
  await deferred.prompt();
  return deferred.userChoice;
}
