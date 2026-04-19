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
    <section className="flex flex-col gap-4">
      {loading ? (
        <p className="text-[#2c3e50]">جار تحميل بيانات القرآن...</p>
      ) : null}
      {error ? <p className="font-medium text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="text-2xl font-bold">فهرس السور</h2>
            <div className="min-w-55 flex-1 rounded-[20px] bg-white px-3.75 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <input
                type="text"
                placeholder="ابحث عن سورة..."
                value={surahSearch}
                onChange={(event) => setSurahSearch(event.target.value)}
                className="w-full border-0 bg-transparent text-base text-[#2c3e50] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-black/5 bg-white/90 p-3.5 text-right shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                onClick={() => navigate(`/${chapter.id}`)}
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#1b5e20] font-['Amiri'] font-bold text-white">
                  {chapter.id}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="font-['Amiri'] text-[1.2rem] text-[#1b5e20]">
                    سورة {chapter.name_arabic}
                  </span>
                  <span className="text-[0.85rem] text-[#7f8c8d]">
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
