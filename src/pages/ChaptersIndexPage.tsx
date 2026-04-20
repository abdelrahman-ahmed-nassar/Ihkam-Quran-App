import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { dropCurrentDb, initQuranData, quranTable } from "../db";
import type { Chapter } from "../types/quran";

const ChaptersIndexPage = () => {
  const [surahSearch, setSurahSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const quranRecord = useLiveQuery(() => quranTable.get("quran"));
  const quranData = quranRecord?.data ?? null;

  useEffect(() => {
    initQuranData()
      .catch((err) => {
        console.error("Failed to initialize Quran data:", err);
        setError("فشل تحميل بيانات القرآن. حاول إعادة تحميل الصفحة.");
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshQuranData = async () => {
    setLoading(true);
    setError(null);

    try {
      await dropCurrentDb();
      await initQuranData();
    } catch (err) {
      console.error("Failed to refresh Quran data:", err);
      setError("فشل تحديث بيانات القرآن. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

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
              <button
                type="button"
                onClick={refreshQuranData}
                disabled={loading}
                className="rounded-md border border-text-main/20 px-3 py-2 text-sm font-medium text-text-main transition hover:bg-text-main/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                تحديث
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className="chapter-card"
                onClick={() => navigate(`/${chapter.startPage}`)}
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
