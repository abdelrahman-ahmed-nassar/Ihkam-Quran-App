import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
  return `${getQpcFontName(page)}, UthmanicHafs, Tahoma, Arial, sans-serif`;
}

function getPageFontPath(page: number) {
  return `${import.meta.env.BASE_URL}fonts/QUL/QUL${formatPageId(page)}.ttf`;
}

const ReadPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const currentPage = parseRoutePage(pageId);
  const normalizedPageId = formatPageId(currentPage);

  const [wordsMap, setWordsMap] = useState<WordsMap | null>(null);
  const [layout, setLayout] = useState<QuranLine[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [targetPageInput, setTargetPageInput] = useState(normalizedPageId);
  const [gestureStartX, setGestureStartX] = useState<number | null>(null);
  const [gestureDeltaX, setGestureDeltaX] = useState(0);
  const [isDraggingPage, setIsDraggingPage] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev" | null>(
    null,
  );

  // Sync input
  useEffect(() => {
    setTargetPageInput(normalizedPageId);
  }, [normalizedPageId]);

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
      link.type = "font/ttf";
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
      if (gestureDeltaX < 0) {
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

  const onGoToPage = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = Number.parseInt(targetPageInput, 10);
    if (Number.isNaN(parsed)) {
      setTargetPageInput(normalizedPageId);
      return;
    }

    goToPage(parsed);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2 border-b pb-3">
        <Button variant="outline" onClick={() => navigate("/")}>
          العودة للرئيسية
        </Button>
        <h1 className="text-lg font-semibold">القراءة</h1>
      </header>

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex items-center gap-2" onSubmit={onGoToPage}>
          <label>Page</label>
          <input
            type="number"
            min={MIN_PAGE}
            max={MAX_PAGE}
            value={targetPageInput}
            onChange={(e) => setTargetPageInput(e.target.value)}
            className="h-8 w-24 rounded-md border px-2"
          />
          <Button type="submit">Go</Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Swipe left/right or use keyboard arrows to turn pages.
        </p>
      </div>

      <p>
        pageId: {normalizedPageId} ({MIN_PAGE} - {MAX_PAGE})
      </p>

      {/* 🧾 Render */}
      {loadingError ? (
        <p className="text-destructive">{loadingError}</p>
      ) : !wordsMap ? (
        <p>Loading...</p>
      ) : (
        <section
          className="mx-auto w-full max-w-5xl select-none overflow-x-auto"
          dir="rtl"
          aria-label={`Quran page ${normalizedPageId}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div
            className={`w-full p-2 text-[clamp(1.15rem,6.3vw,2rem)] leading-[1.75] text-right [text-align-last:justify] [unicode-bidi:embed] sm:p-3 sm:text-4xl sm:leading-[2.05] md:p-8 md:text-6xl ${isDraggingPage ? "" : "transition-transform duration-200 ease-out"}`}
            style={{
              fontFamily: getQpcFontStack(currentPage),
              transform: `translateX(${pageOffset}px)`,
              opacity: pageOpacity,
            }}
          >
            {pageLines.map((line, idx) => {
              const lineKey = `${line.line_number}-${idx}`;

              if (line.line_type === "surah_name") {
                return (
                  <div
                    key={lineKey}
                    className="mb-2 whitespace-nowrap text-center font-bold [text-align-last:center]"
                    style={{
                      fontFamily: getQpcFontStack(currentPage),
                    }}
                  >
                    سورة {line.surah_number}
                  </div>
                );
              }

              if (line.line_type === "basmallah") {
                return (
                  <div
                    key={lineKey}
                    className="mb-2 flex items-center justify-center whitespace-nowrap [text-align-last:center]"
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
                  className="mb-1 block w-full whitespace-nowrap text-right [direction:rtl] md:mb-3"
                >
                  {/* font-size: 0 removes inter-element whitespace for precise justification */}
                  <div
                    className={
                      line.is_centered
                        ? "block w-full whitespace-nowrap text-[0] text-center [text-align-last:center]"
                        : "block w-full whitespace-nowrap text-[0] text-justify [text-align-last:justify]"
                    }
                  >
                    {words.map((word) => (
                      <span
                        key={word.id}
                        id={`word-${word.id}`}
                        className="inline-block align-baseline text-[clamp(1.15rem,6.3vw,2rem)] sm:text-4xl md:text-6xl"
                        data-location={word.location}
                      >
                        {word.textGlyph}
                      </span>
                    ))}
                  </div>
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
