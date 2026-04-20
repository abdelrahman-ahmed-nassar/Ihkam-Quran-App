export type BackgroundColorSetting = "default" | "soft";

const BACKGROUND_COLOR_STORAGE_KEY = "ihkam:settings:bg-color";
const DEFAULT_BACKGROUND_COLOR: BackgroundColorSetting = "default";

const isBackgroundColorSetting = (
  value: string | null,
): value is BackgroundColorSetting => {
  return value === "default" || value === "soft";
};

export const getStoredBackgroundColorSetting = (): BackgroundColorSetting => {
  if (typeof window === "undefined") return DEFAULT_BACKGROUND_COLOR;

  const storedValue = window.localStorage.getItem(BACKGROUND_COLOR_STORAGE_KEY);

  return isBackgroundColorSetting(storedValue)
    ? storedValue
    : DEFAULT_BACKGROUND_COLOR;
};

export const applyBackgroundColorSetting = (
  setting: BackgroundColorSetting,
): void => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (setting === "soft") {
    root.dataset.bgColor = "soft";
    return;
  }

  delete root.dataset.bgColor;
};

export const setStoredBackgroundColorSetting = (
  setting: BackgroundColorSetting,
): void => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(BACKGROUND_COLOR_STORAGE_KEY, setting);
};
