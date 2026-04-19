import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Navigate, Route, Routes } from "react-router-dom";
import { initQuranData, quranTable } from "./db";
import ChaptersIndexPage from "./pages/ChaptersIndexPage";
import ReadPage from "./pages/ReadPage";

const App = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const quranRecord = useLiveQuery(() => quranTable.get("quran"));

  useEffect(() => {
    initQuranData()
      .catch((err) => {
        console.error("Failed to initialize Quran data:", err);
        setError("فشل تحميل بيانات القرآن. حاول إعادة تحميل الصفحة.");
      })
      .finally(() => setLoading(false));
  }, []);

  const quranData = quranRecord?.data ?? null;

  return (
    <div
      className="flex h-screen min-h-dvh flex-col overflow-hidden min-[900px]:flex-row"
      dir="rtl"
    >
      <main className="min-w-0 flex-1 overflow-y-auto p-5 pb-21.5 min-[900px]:px-5 min-[900px]:pb-5">
        <Routes>
          <Route
            path="/"
            element={
              <ChaptersIndexPage
                loading={loading}
                error={error}
                quranData={quranData}
              />
            }
          />
          <Route
            path="/:surahId"
            element={
              <ReadPage loading={loading} error={error} quranData={quranData} />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
