import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { House } from "lucide-react";
import { getChapterById } from "@/lib/quran";

import type { Word, WordsMap } from "@/types/quran-words";
import type { QuranLine } from "@/types/quran-layout";
import {
  getQuranData,
  getQuranPagesData,
  getQuranWordsData,
  initQuranData,
  initQuranPagesData,
  initQuranWordsData,
} from "@/db";

import { Button } from "@/components/ui/button";

const MIN_PAGE = 1;
const MAX_PAGE = 604;
const SWIPE_TRIGGER_PX = 60;
const MAX_DRAG_PX = 120;

const clampPage = (page: number) =>
  Math.min(MAX_PAGE, Math.max(MIN_PAGE, page));

const formatPageId = (page: number) => page.toString().padStart(3, "0");

const parseRoutePage = (value?: string) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? MIN_PAGE : clampPage(parsed);
};

function getQpcFontName(page: number) {
  return `QCF${String(page).padStart(3, "0")}`;
}

function getQpcFontStack(page: number) {
  return `${getQpcFontName(page)}, UthmanicHafs, Arial, sans-serif`;
}

function getPageFontPath(page: number) {
  return `${import.meta.env.BASE_URL}fonts/QUL/QUL${formatPageId(page)}.woff2`;
}

const ReadPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const currentPage = parseRoutePage(pageId);
  const normalizedPageId = formatPageId(currentPage);

  const [wordsMap, setWordsMap] = useState<WordsMap | null>(null);
  const [chaptersData, setChaptersData] =
    useState<Awaited<ReturnType<typeof getQuranData>>>(null);
  const [layout, setLayout] = useState<QuranLine[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [fontLoadingErrorPage, setFontLoadingErrorPage] = useState<
    number | null
  >(null);
  const [readyFontPage, setReadyFontPage] = useState<number | null>(null);

  const [gestureStartX, setGestureStartX] = useState<number | null>(null);
  const [gestureDeltaX, setGestureDeltaX] = useState(0);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev" | null>(
    null,
  );

  // Redirect invalid route
  useEffect(() => {
    if (pageId !== normalizedPageId) {
      navigate(`/${normalizedPageId}`, { replace: true });
    }
  }, [pageId, normalizedPageId, navigate]);

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
        const [cachedWords, cachedPages, cachedChapters] = await Promise.all([
          getQuranWordsData(),
          getQuranPagesData(),
          getQuranData(),
        ]);
        const [wordsData, layoutData, chapterData] = await Promise.all([
          cachedWords ? Promise.resolve(cachedWords) : initQuranWordsData(),
          cachedPages ? Promise.resolve(cachedPages) : initQuranPagesData(),
          cachedChapters ? Promise.resolve(cachedChapters) : initQuranData(),
        ]);

        setWordsMap(wordsData);
        setChaptersData(chapterData);
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

  const quranRecord = useMemo(() => {
    if (!chaptersData) return undefined;

    return {
      id: "quranChapters",
      chaptersData,
    };
  }, [chaptersData]);

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
    (page: number, direction?: "next" | "prev") => {
      const nextPage = clampPage(page);
      if (nextPage === currentPage) return;

      setTurnDirection(direction ?? (nextPage > currentPage ? "next" : "prev"));
      navigate(`/${formatPageId(nextPage)}`);
    },
    [currentPage, navigate],
  );

  useEffect(() => {
    if (!turnDirection) return;

    const timeoutId = window.setTimeout(() => {
      setTurnDirection(null);
    }, 220);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [turnDirection]);

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
        goToPage(currentPage + 1, "next");
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToPage(currentPage - 1, "prev");
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

    setGestureStartX(point.clientX);
    setGestureDeltaX(0);
    setIsDraggingPage(true);
  };

  const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (gestureStartX === null) return;

    const point = event.touches[0];
    if (!point) return;

    setGestureDeltaX(point.clientX - gestureStartX);
  };

  const onTouchEnd = () => {
    if (Math.abs(gestureDeltaX) >= SWIPE_TRIGGER_PX) {
      if (gestureDeltaX > 0) {
        goToPage(currentPage + 1, "next");
      } else {
        goToPage(currentPage - 1, "prev");
      }
    }

    setGestureStartX(null);
    setGestureDeltaX(0);
    setIsDraggingPage(false);
  };

  const dragOffset = Math.max(
    -MAX_DRAG_PX,
    Math.min(MAX_DRAG_PX, gestureDeltaX),
  );
  const settleOffset =
    turnDirection === "next" ? -28 : turnDirection === "prev" ? 28 : 0;
  const pageOffset = isDraggingPage ? dragOffset : settleOffset;
  const pageOpacity =
    isDraggingPage && dragOffset !== 0
      ? 1 - Math.min(0.18, Math.abs(dragOffset) / 400)
      : 1;
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
        onClick={() => navigate("/")}
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
          className="flex h-full w-full select-none items-center justify-center overflow-hidden"
          dir="rtl"
          aria-label={`Quran page ${normalizedPageId}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            className={`mx-auto w-max max-w-full px-3 [unicode-bidi:embed] ${
              isDraggingPage ? "" : "transition-transform duration-200 ease-out"
            }`}
            style={{
              fontFamily: getQpcFontStack(currentPage),
              fontSize: dynamicFontSize,
              lineHeight: LINE_HEIGHT_RATIO,
              transform: `translateX(${pageOffset}px)`,
              opacity: pageOpacity,
            }}
          >
            {pageLines.map((line, idx) => {
              const lineKey = `${line.line_number}-${idx}`;

              if (line.line_type === "surah_name") {
                const chapter = getChapterById(
                  quranRecord,
                  String(line.surah_number),
                );

                return (
                  <div
                    key={lineKey}
                    className="w-full overflow-hidden whitespace-nowrap text-center font-bold [text-align-last:center]"
                    style={{ fontFamily: "UthmanicHafs, Arial, sans-serif" }}
                  >
                    سورة {chapter?.name_arabic ?? line.surah_number}
                  </div>
                );
              }

              if (line.line_type === "basmallah") {
                return (
                  <div
                    key={lineKey}
                    className="flex w-full items-center justify-center overflow-hidden whitespace-nowrap [text-align-last:center]"
                    style={{
                      fontFamily:
                        "QCFBSML, UthmanicHafs, Tahoma, Arial, sans-serif",
                    }}
                  >
                    ﷽
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
                      className="inline-block align-baseline text-[1em]"
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
    </div>
  );
};

export default ReadPage;
