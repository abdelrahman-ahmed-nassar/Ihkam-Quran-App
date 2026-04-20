import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { quranChaptersTable } from "../db";
import { InstallPWAButton } from "../components/install-pwa-button";
import { UpdateQuranDataButton } from "../components/update-quran-data-button";
import type { Chapter } from "../types/quran";

type ChaptersIndexPageProps = {
  loading: boolean;
  error: string | null;
  onRefreshQuranData: () => Promise<void>;
  onSelectPage: (page: number) => void;
};

const ChaptersIndexPage = ({
  loading,
  error,
  onRefreshQuranData,
  onSelectPage,
}: ChaptersIndexPageProps) => {
  const [surahSearch, setSurahSearch] = useState("");
  const quranChaptersRecord = useLiveQuery(() =>
    quranChaptersTable.get("quranChapters"),
  );
  const quranChaptersData = quranChaptersRecord?.chaptersData ?? null;

  const chapters = useMemo<Chapter[]>(() => {
    if (!quranChaptersData?.chapters) return [];

    return Object.values(quranChaptersData.chapters)
      .filter((chapter) => chapter.name_arabic.includes(surahSearch.trim()))
      .sort((a, b) => a.id - b.id);
  }, [quranChaptersData, surahSearch]);

  return (
    <section className="page-shell">
      {loading ? (
        <p className="text-text-main">جار تحميل بيانات القرآن...</p>
      ) : null}
      {error ? <p className="font-medium text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="text-2xl font-bold">فهرس السور</h2>
            <div className="flex w-full items-center gap-2">
              <div className="chapter-search-shell">
                <input
                  type="text"
                  placeholder="ابحث عن سورة..."
                  value={surahSearch}
                  onChange={(event) => setSurahSearch(event.target.value)}
                  className="w-full border-0 bg-transparent text-base text-text-main outline-none"
                />
              </div>
              <UpdateQuranDataButton
                disabled={loading}
                onRefresh={onRefreshQuranData}
              />
              <InstallPWAButton
                size="default"
                variant="outline"
                className="w-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className="chapter-card"
                onClick={() => onSelectPage(chapter.startPage)}
              >
                <span className="chapter-index-pill">{chapter.id}</span>
                <span className="flex flex-1 flex-col">
                  <span className="chapter-name">
                    سورة {chapter.name_arabic}
                  </span>
                  <span className="chapter-meta">
                    {chapter.verses_count} آية
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};

export default ChaptersIndexPage;
