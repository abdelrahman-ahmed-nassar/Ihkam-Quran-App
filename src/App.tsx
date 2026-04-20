import { useEffect, useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  dropCurrentDb,
  initQuranPagesData,
  initQuranWordsData,
  initQuranData,
} from "./db";
import ChaptersIndexPage from "./pages/ChaptersIndexPage";
import ReadPage from "./pages/ReadPage";

const App = () => {
  const [quranChaptersLoading, setQuranChaptersLoading] = useState(true);
  const [quranChaptersError, setQuranChaptersError] = useState<string | null>(
    null,
  );

  const initializeQuranChaptersData = async (resetDb = false) => {
    setQuranChaptersLoading(true);
    setQuranChaptersError(null);

    try {
      if (resetDb) {
        await dropCurrentDb();
      }

      await Promise.all([
        initQuranData(),
        initQuranWordsData(),
        initQuranPagesData(),
      ]);
    } catch (err) {
      console.error("Failed to initialize Quran data:", err);
      setQuranChaptersError(
        "فشل تحميل بيانات القرآن. حاول إعادة تحميل الصفحة.",
      );
    } finally {
      setQuranChaptersLoading(false);
    }
  };

  useEffect(() => {
    void initializeQuranChaptersData();
  }, []);

  return (
    <div
      className="flex h-screen min-h-dvh flex-col overflow-hidden min-[900px]:flex-row"
      dir="rtl"
    >
      <main className="min-w-0 flex-1 overflow-y-auto p-5 pb-21.5 min-[900px]:px-5 min-[900px]:pb-5">
        <HashRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ChaptersIndexPage
                  loading={quranChaptersLoading}
                  error={quranChaptersError}
                  onRefreshQuranData={() => initializeQuranChaptersData(true)}
                />
              }
            />
            <Route path="/:pageId" element={<ReadPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </main>
    </div>
  );
};

export default App;
