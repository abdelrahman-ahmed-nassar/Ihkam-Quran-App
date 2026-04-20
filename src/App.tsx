import { useCallback, useEffect, useState } from "react";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  dropCurrentDb,
  initQuranPagesData,
  initQuranWordsData,
  initQuranData,
} from "./db";
import {
  applyBackgroundColorSetting,
  getStoredBackgroundColorSetting,
  setStoredBackgroundColorSetting,
  type BackgroundColorSetting,
} from "./lib/settings";
import ChaptersIndexPage from "./pages/ChaptersIndexPage";
import ReadPage from "./pages/ReadPage";
import SettingsPage from "./pages/SettingsPage";

const parsePageParam = (pageParam: string | undefined) => {
  if (!pageParam) return null;

  const parsed = Number(pageParam);
  return Number.isInteger(parsed) ? parsed : null;
};

const App = () => {
  const [quranChaptersLoading, setQuranChaptersLoading] = useState(true);
  const [quranChaptersError, setQuranChaptersError] = useState<string | null>(
    null,
  );
  const [backgroundColorSetting, setBackgroundColorSetting] =
    useState<BackgroundColorSetting>(() => getStoredBackgroundColorSetting());

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

  useEffect(() => {
    applyBackgroundColorSetting(backgroundColorSetting);
  }, [backgroundColorSetting]);

  const handleBackgroundColorChange = useCallback(
    (setting: BackgroundColorSetting) => {
      setBackgroundColorSetting(setting);
      setStoredBackgroundColorSetting(setting);
    },
    [],
  );

  const ChaptersRoute = () => {
    const navigate = useNavigate();

    return (
      <ChaptersIndexPage
        loading={quranChaptersLoading}
        error={quranChaptersError}
        onRefreshQuranData={() => initializeQuranChaptersData(true)}
        onOpenSettings={() => navigate("/settings")}
        onSelectPage={(page) => navigate(`/page/${page}`)}
      />
    );
  };

  const SettingsRoute = () => {
    const navigate = useNavigate();

    return (
      <SettingsPage
        backgroundColorSetting={backgroundColorSetting}
        onBackgroundColorChange={handleBackgroundColorChange}
        onBackToIndex={() => navigate("/")}
      />
    );
  };

  const ReadRoute = () => {
    const navigate = useNavigate();
    const { pageNumber } = useParams<{ pageNumber: string }>();
    const parsedPage = parsePageParam(pageNumber);

    const handlePageChange = useCallback(
      (page: number) => {
        if (page === parsedPage) return;

        navigate(`/page/${page}`, { replace: true });
      },
      [navigate, parsedPage],
    );

    if (parsedPage === null) {
      return <Navigate to="/" replace />;
    }

    return (
      <ReadPage
        initialPage={parsedPage}
        onBackToIndex={() => navigate("/")}
        onPageChange={handlePageChange}
      />
    );
  };

  return (
    <div
      className="flex h-screen min-h-dvh flex-col overflow-hidden min-[900px]:flex-row"
      dir="rtl"
    >
      <main className="min-w-0 flex-1 overflow-y-auto p-5 pb-21.5 min-[900px]:px-5 min-[900px]:pb-5">
        <HashRouter>
          <Routes>
            <Route path="/" element={<ChaptersRoute />} />
            <Route path="/settings" element={<SettingsRoute />} />
            <Route path="/page/:pageNumber" element={<ReadRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </main>
    </div>
  );
};

export default App;
