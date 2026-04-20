import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { House } from "lucide-react";

import type { Word, WordsMap } from "@/types/quran-words";
import type { QuranLine } from "@/types/quran-layout";
import {
  getQuranPagesData,
  getQuranWordsData,
  initQuranPagesData,
  initQuranWordsData,
} from "@/db";

import { Button } from "@/components/ui/button";

const MIN_PAGE = 1;
const MAX_PAGE = 604;
const SWIPE_TRIGGER_PX = 60;
const MAX_DRAG_PX = 120;
const SWIPE_SETTLE_PX = 16;
const SWIPE_TRANSITION_MS = 170;

const clampPage = (page: number) => {
  const normalizedPage = Number.isFinite(page) ? Math.trunc(page) : MIN_PAGE;

  return Math.min(MAX_PAGE, Math.max(MIN_PAGE, normalizedPage));
};

const formatPageId = (page: number) => page.toString().padStart(3, "0");
const toEasternArabicDigits = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
const isArabicNumberWord = (value: string) =>
  /^[\u0660-\u0669\u06F0-\u06F9]+$/.test(value.trim());

function getQpcFontName(page: number) {
  return `QCF${String(page).padStart(3, "0")}`;
}

function getQpcFontStack(page: number) {
  return `${getQpcFontName(page)}, UthmanicHafs, Arial, sans-serif`;
}

function getPageFontPath(page: number) {
  return `${import.meta.env.BASE_URL}fonts/QUL/QUL${formatPageId(page)}.woff2`;
}

function getTopBannerPath() {
  return `${import.meta.env.BASE_URL}images/top.png`;
}

function getBismalahPath() {
  return `${import.meta.env.BASE_URL}images/bismalah.svg`;
}

type ReadPageProps = {
  initialPage: number;
  onBackToIndex: () => void;
  onPageChange?: (page: number) => void;
};

const ReadPage = ({
  initialPage,
  onBackToIndex,
  onPageChange,
}: ReadPageProps) => {
  const [currentPage, setCurrentPage] = useState(() => clampPage(initialPage));
  const normalizedPageId = formatPageId(currentPage);
  const localizedPageNumber = useMemo(
    () => toEasternArabicDigits(currentPage),
    [currentPage],
  );

  const [wordsMap, setWordsMap] = useState<WordsMap | null>(null);
  const [layout, setLayout] = useState<QuranLine[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [fontLoadingErrorPage, setFontLoadingErrorPage] = useState<
    number | null
  >(null);
  const [readyFontPage, setReadyFontPage] = useState<number | null>(null);

  const pageContentRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragDeltaXRef = useRef(0);
  const dragRafRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrentPage(clampPage(initialPage));
  }, [initialPage]);

  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Help browser prioritize page fonts: current page (preload), adjacent pages (prefetch)
  useEffect(() => {
    const pagesToWarm = [currentPage, currentPage - 1, currentPage + 1].filter(
      (page) => page >= MIN_PAGE && page <= MAX_PAGE,
    );

    const createdLinks: HTMLLinkElement[] = [];

    for (const page of pagesToWarm) {
      const link = document.createElement("link");
      link.rel = page === currentPage ? "preload" : "prefetch";
      link.as = "font";
      link.type = "font/woff2";
      link.href = getPageFontPath(page);
      link.crossOrigin = "anonymous";

      document.head.appendChild(link);
      createdLinks.push(link);
    }

    return () => {
      for (const link of createdLinks) {
        link.remove();
      }
    };
  }, [currentPage]);

  // Hide Quran glyphs until the page-specific font is ready.
  useEffect(() => {
    let cancelled = false;
    const fontName = getQpcFontName(currentPage);
    const fontQuery = `1em "${fontName}"`;

    const ensureFontReady = async () => {
      try {
        if (!document.fonts.check(fontQuery)) {
          await document.fonts.load(fontQuery);
        }

        if (cancelled) return;

        if (document.fonts.check(fontQuery)) {
          setReadyFontPage(currentPage);
        } else {
          setFontLoadingErrorPage(currentPage);
        }
      } catch (err) {
        if (cancelled) return;

        setFontLoadingErrorPage(currentPage);
        console.error("Failed to load page font", err);
      }
    };

    void ensureFontReady();

    return () => {
      cancelled = true;
    };
  }, [currentPage]);

  // Load/cached quran data once from IndexedDB
  useEffect(() => {
    const load = async () => {
      try {
        const [cachedWords, cachedPages] = await Promise.all([
          getQuranWordsData(),
          getQuranPagesData(),
        ]);
        const [wordsData, layoutData] = await Promise.all([
          cachedWords ? Promise.resolve(cachedWords) : initQuranWordsData(),
          cachedPages ? Promise.resolve(cachedPages) : initQuranPagesData(),
        ]);

        setWordsMap(wordsData);
        setLayout(layoutData);
        setLoadingError(null);
      } catch (err) {
        setLoadingError("تعذر تحميل بيانات المصحف");
        console.error("Failed to load quran data", err);
      }
    };

    void load();
  }, []);

  // 🔥 Convert WordsMap → sorted array ONCE
  const wordsArray = useMemo(() => {
    if (!wordsMap) return [];

    return Object.values(wordsMap).sort((a, b) => a.id - b.id);
  }, [wordsMap]);

  // 🔥 Filter lines for current page
  const pageLines = useMemo(() => {
    return layout
      .filter((line) => line.page_number === currentPage)
      .sort((a, b) => a.line_number - b.line_number);
  }, [layout, currentPage]);

  // 🔥 Fast slice (O(1))
  const getWordsSlice = (first: number, last: number): Word[] => {
    if (first === 0 && last === 0) return [];

    // ids are 1-based → array is 0-based
    return wordsArray.slice(first - 1, last);
  };

  const goToPage = useCallback(
    (page: number) => {
      const nextPage = clampPage(page);
      if (nextPage === currentPage) return;

      setCurrentPage(nextPage);
    },
    [currentPage],
  );

  const applyPageTransform = useCallback(
    (offsetPx: number, withTransition: boolean) => {
      const element = pageContentRef.current;
      if (!element) return;

      element.style.transition = withTransition
        ? `transform ${SWIPE_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
        : "none";
      element.style.transform = `translate3d(${offsetPx}px, 0, 0)`;
    },
    [],
  );

  useEffect(() => {
    applyPageTransform(0, false);
  }, [currentPage, applyPageTransform]);

  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isEditable =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT" ||
        target?.isContentEditable;

      if (isEditable) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPage(currentPage + 1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToPage(currentPage - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [currentPage, goToPage]);

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const point = event.touches[0];
    if (!point) return;

    dragStartXRef.current = point.clientX;
    dragDeltaXRef.current = 0;
    applyPageTransform(0, false);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (dragStartXRef.current === null) return;

    const point = event.touches[0];
    if (!point) return;

    const delta = point.clientX - dragStartXRef.current;
    dragDeltaXRef.current = Math.max(
      -MAX_DRAG_PX,
      Math.min(MAX_DRAG_PX, delta),
    );

    if (dragRafRef.current !== null) return;

    dragRafRef.current = window.requestAnimationFrame(() => {
      dragRafRef.current = null;
      applyPageTransform(dragDeltaXRef.current, false);
    });
  };

  const onTouchEnd = () => {
    const delta = dragDeltaXRef.current;

    if (Math.abs(delta) >= SWIPE_TRIGGER_PX) {
      const settleOffset = delta > 0 ? SWIPE_SETTLE_PX : -SWIPE_SETTLE_PX;
      applyPageTransform(settleOffset, true);

      if (delta > 0) {
        goToPage(currentPage + 1);
      } else {
        goToPage(currentPage - 1);
      }
    } else {
      applyPageTransform(0, true);
    }

    dragStartXRef.current = null;
    dragDeltaXRef.current = 0;
  };
  const fontLoadingError =
    fontLoadingErrorPage === currentPage ? "تعذر تحميل خط الصفحة" : null;
  const errorMessage = loadingError ?? fontLoadingError;
  const isPageFontReady = readyFontPage === currentPage;

  // Compute font-size so every line fits within the screen height.
  // Each line occupies (fontSize × LINE_HEIGHT_RATIO) px vertically.
  // Reserve ~2.5rem for the floating home button so it never overlaps text.
  const LINE_HEIGHT_RATIO = 2.08;
  const lineCount = Math.max(pageLines.length, 1);
  const dynamicFontSize = `min(calc((100dvh - 5rem) / ${lineCount * LINE_HEIGHT_RATIO}), calc((100vw - 1.5rem) / 17))`;

  return (
    // Fixed viewport shell — absolutely no scroll in any direction
    <div className="fixed inset-0 overflow-hidden bg-background">
      {/* Home button — floats above the page, subtle until hovered */}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="العودة للرئيسية"
        onClick={onBackToIndex}
        className="absolute left-2 top-2 z-20 opacity-40 transition-opacity hover:opacity-100"
      >
        <House />
      </Button>

      {/* Error state */}
      {errorMessage && (
        <p className="flex h-full items-center justify-center text-destructive">
          {errorMessage}
        </p>
      )}

      {/* Loading state: either Quran data or current page font is still loading */}
      {(!wordsMap || !isPageFontReady) && !errorMessage && (
        <p className="flex h-full items-center justify-center text-muted-foreground">
          …
        </p>
      )}

      {/* 🧾 Page render */}
      {wordsMap && isPageFontReady && !errorMessage && (
        <section
          className="flex h-full w-full select-none items-center justify-center overflow-hidden [touch-action:pan-y]"
          dir="rtl"
          aria-label={`Quran page ${normalizedPageId}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            ref={pageContentRef}
            className="mx-auto w-max max-w-full px-3 [unicode-bidi:embed] will-change-transform"
            style={{
              fontFamily: getQpcFontStack(currentPage),
              fontSize: dynamicFontSize,
              lineHeight: LINE_HEIGHT_RATIO,
            }}
          >
            {pageLines.map((line, idx) => {
              const lineKey = `${line.line_number}-${idx}`;

              if (line.line_type === "surah_name") {
                return (
                  <div
                    key={lineKey}
                    className="mx-auto flex h-[1.8em] w-full max-w-[18em] items-center justify-center overflow-hidden whitespace-nowrap bg-contain bg-center bg-no-repeat px-[2.7em] text-center text-[1.25em] leading-none [text-align-last:center]"
                    style={{
                      fontFamily: "surah-name-v4-icon, Arial, sans-serif",
                      backgroundImage: `url("${getTopBannerPath()}")`,
                    }}
                  >
                    <span className="inline-block">
                      {`surah${line.surah_number.toString().padStart(3, "0")}`}
                    </span>
                  </div>
                );
              }

              if (line.line_type === "basmallah") {
                return (
                  <div
                    key={lineKey}
                    className="flex w-full items-center justify-center overflow-hidden whitespace-nowrap [text-align-last:center]"
                  >
                    <img
                      src={getBismalahPath()}
                      alt="بسم الله الرحمن الرحيم"
                      className="my-2 h-[1.5em] w-auto"
                      draggable={false}
                    />
                  </div>
                );
              }

              const words = getWordsSlice(
                line.first_word_id,
                line.last_word_id,
              );

              return (
                <div
                  key={lineKey}
                  // text-[0] collapses inline whitespace gaps for tight justification;
                  // each <span> restores its own size via text-[1em].
                  className={`block w-full overflow-hidden whitespace-nowrap text-[0] [direction:rtl] ${
                    line.is_centered
                      ? "text-center [text-align-last:center]"
                      : "text-justify [text-align-last:justify]"
                  }`}
                >
                  {words.map((word) => (
                    <span
                      key={word.id}
                      id={`word-${word.id}`}
                      className={`inline-block align-baseline text-[1em] ${
                        isArabicNumberWord(word.textUnicode)
                          ? "text-[#6b3200]"
                          : ""
                      }`}
                      data-location={word.location}
                    >
                      {word.textGlyph}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
        {localizedPageNumber}
      </div>
    </div>
  );
};

export default ReadPage;
