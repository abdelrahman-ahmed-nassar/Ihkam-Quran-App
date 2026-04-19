import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Chapter, QuranData } from "../types/quran";

type ChaptersIndexPageProps = {
  loading: boolean;
  error: string | null;
  quranData: QuranData | null;
};

const ChaptersIndexPage = ({
  loading,
  error,
  quranData,
}: ChaptersIndexPageProps) => {
  const [surahSearch, setSurahSearch] = useState("");
  const navigate = useNavigate();

  const chapters = useMemo<Chapter[]>(() => {
    if (!quranData?.chapters) return [];

    return Object.values(quranData.chapters)
      .filter((chapter) => chapter.name_arabic.includes(surahSearch.trim()))
      .sort((a, b) => a.id - b.id);
  }, [quranData, surahSearch]);

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
            <div className="chapter-search-shell">
              <input
                type="text"
                placeholder="ابحث عن سورة..."
                value={surahSearch}
                onChange={(event) => setSurahSearch(event.target.value)}
                className="w-full border-0 bg-transparent text-base text-text-main outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className="chapter-card"
                onClick={() => navigate(`/${chapter.id}`)}
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
