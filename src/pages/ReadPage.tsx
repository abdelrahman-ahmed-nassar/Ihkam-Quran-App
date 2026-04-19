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
      <section className="page-shell">
        <p className="text-text-main">جار تحميل بيانات القرآن...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-shell">
        <p className="font-medium text-red-600">{error}</p>
      </section>
    );
  }

  if (!chapter) {
    return (
      <section className="page-shell">
        <div className="page-header">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="brand-outline-button"
            onClick={() => navigate("/")}
          >
            رجوع
          </Button>
          <h2 className="page-title">السورة غير موجودة</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-header">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="brand-outline-button"
          onClick={() => navigate("/")}
        >
          رجوع
        </Button>
        <h2 className="page-title">{`سورة ${chapter.name_arabic}`}</h2>
        <span />
      </div>

      {chapter.id !== 1 && chapter.id !== 9 ? (
        <div className="bismillah">{BISMILLAH}</div>
      ) : null}

      <div className="quran-reading-panel">
        {currentVerses.map((verse) => (
          <span key={verse.key} className="verse-inline">
            {verse.displayText}
            <span className="verse-marker">
              ۝{arabicNum(verse.verseNumber)}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default ReadPage;
