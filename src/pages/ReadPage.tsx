import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Word, WordsMap } from "@/types/mushaf";
import type { MushafLine } from "@/types/mushaf-layout";

import { Button } from "@/components/ui/button";

const MIN_PAGE = 1;
const MAX_PAGE = 604;

const clampPage = (page: number) =>
  Math.min(MAX_PAGE, Math.max(MIN_PAGE, page));

const formatPageId = (page: number) => page.toString().padStart(3, "0");

const parseRoutePage = (value?: string) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? MIN_PAGE : clampPage(parsed);
};

function getQpcFontName(page: number) {
  return `QCF2${String(page).padStart(3, "0")}`;
}

const ReadPage = () => {
  const { pageId } = useParams();
  const navigate = useNavigate();

  const currentPage = parseRoutePage(pageId);
  const normalizedPageId = formatPageId(currentPage);

  const [wordsMap, setWordsMap] = useState<WordsMap | null>(null);
  const [layout, setLayout] = useState<MushafLine[]>([]);

  const [targetPageInput, setTargetPageInput] = useState(normalizedPageId);

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

  // Load ALL data once
  useEffect(() => {
    const load = async () => {
      try {
        const [wordsRes, layoutRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}qpc-v2.json`),
          fetch(`${import.meta.env.BASE_URL}mushaf-layout/pages.json`),
        ]);

        const wordsData: WordsMap = await wordsRes.json();
        const layoutData: MushafLine[] = await layoutRes.json();

        setWordsMap(wordsData);
        setLayout(layoutData);
      } catch (err) {
        console.error("Failed to load mushaf data", err);
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
    return layout.filter((l) => l.page_number === currentPage);
  }, [layout, currentPage]);

  // 🔥 Fast slice (O(1))
  const getWordsSlice = (first: number, last: number): Word[] => {
    if (first === 0 && last === 0) return [];

    // ids are 1-based → array is 0-based
    return wordsArray.slice(first - 1, last);
  };

  const goToPage = (page: number) => {
    navigate(`/${formatPageId(clampPage(page))}`);
  };

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
        <Button
          variant="outline"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= MIN_PAGE}
        >
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= MAX_PAGE}
        >
          Next
        </Button>

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
      </div>

      <p>
        pageId: {normalizedPageId} ({MIN_PAGE} - {MAX_PAGE})
      </p>

      {/* 🧾 Render */}
      {!wordsMap ? (
        <p>Loading...</p>
      ) : (
        pageLines.map((line, idx) => {
          // 🔹 Special lines
          if (line.line_type === "surah_name") {
            return (
              <div key={idx} className="text-center font-bold">
                سورة {line.surah_number}
              </div>
            );
          }

          if (line.line_type === "basmallah") {
            return (
              <div
                key={idx}
                className="text-center"
                style={{ fontFamily: "QULBSML" }}
              >
                ﷽
              </div>
            );
          }

          // 🔹 Ayah line
          const words = getWordsSlice(line.first_word_id, line.last_word_id);

          return (
            <div
              key={idx}
              className="line"
              style={{
                fontFamily: getQpcFontName(currentPage),
                textAlign: line.is_centered ? "center" : "right",
              }}
            >
              {words.map((w) => w.text).join(" ")}
            </div>
          );
        })
      )}
    </div>
  );
};

export default ReadPage;
