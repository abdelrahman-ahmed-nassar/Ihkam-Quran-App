import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { BISMILLAH } from "../lib/app-types";
import type { Chapter, QuranData } from "../types/quran";

type VerseItem = {
  key: string;
  verseNumber: number;
  text: string;
  displayText: string;
};

const arabicNum = (value: number) =>
  value.toString().replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);

type ReadPageProps = {
  loading: boolean;
  error: string | null;
  quranData: QuranData | null;
};

const ReadPage = ({ loading, error, quranData }: ReadPageProps) => {
  const navigate = useNavigate();
  const { surahId } = useParams();
  const currentSurahId = surahId ? Number(surahId) : null;

  const chapter = useMemo<Chapter | null>(() => {
    if (!quranData || !currentSurahId || Number.isNaN(currentSurahId)) {
      return null;
    }
    return quranData.chapters[String(currentSurahId) as `${number}`] ?? null;
  }, [quranData, currentSurahId]);

  const currentVerses = useMemo<VerseItem[]>(() => {
    if (!quranData || !currentSurahId || Number.isNaN(currentSurahId)) {
      return [];
    }

    return Object.entries(quranData.verses)
      .filter(([key]) => key.startsWith(`${currentSurahId}:`))
      .map(([key, text]) => {
        const verseNumber = Number(key.split(":")[1]);
        const displayText =
          verseNumber === 1 &&
          currentSurahId !== 1 &&
          currentSurahId !== 9 &&
          text.startsWith(`${BISMILLAH} `)
            ? text.replace(`${BISMILLAH} `, "")
            : text;

        return {
          key,
          verseNumber,
          text,
          displayText,
        };
      })
      .sort((a, b) => a.verseNumber - b.verseNumber);
  }, [quranData, currentSurahId]);

  if (loading) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[#2c3e50]">جار تحميل بيانات القرآن...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-4">
        <p className="font-medium text-red-600">{error}</p>
      </section>
    );
  }

  if (!chapter) {
    return (
      <section className="flex flex-col gap-4">
        <div className="sticky top-0 z-10 mb-1 flex items-center justify-between gap-2.5 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#1b5e20] text-[#1b5e20]"
            onClick={() => navigate("/")}
          >
            رجوع
          </Button>
          <h2 className="text-xl font-bold">السورة غير موجودة</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 mb-1 flex items-center justify-between gap-2.5 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#1b5e20] text-[#1b5e20]"
          onClick={() => navigate("/")}
        >
          رجوع
        </Button>
        <h2 className="text-xl font-bold">{`سورة ${chapter.name_arabic}`}</h2>
        <span />
      </div>

      {chapter.id !== 1 && chapter.id !== 9 ? (
        <div className="mb-1 text-center font-['Amiri'] text-[1.8rem] text-[#1b5e20]">
          {BISMILLAH}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-7.5 text-justify font-['Amiri'] text-[1.6rem] leading-[2.8] shadow-[0_2px_8px_rgba(0,0,0,0.05)] [text-justify:inter-word]">
        {currentVerses.map((verse) => (
          <span
            key={verse.key}
            className="cursor-pointer rounded px-1.25 transition-colors hover:bg-[#ffa0001a]"
          >
            {verse.displayText}
            <span className="mx-2 whitespace-nowrap text-[1.1rem] text-[#ffa000]">
              ۝{arabicNum(verse.verseNumber)}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default ReadPage;
