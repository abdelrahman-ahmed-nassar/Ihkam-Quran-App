import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import ChaptersIndexPage from "./pages/ChaptersIndexPage";
import ReadPage from "./pages/ReadPage";

const App = () => {
  return (
    <div
      className="flex h-screen min-h-dvh flex-col overflow-hidden min-[900px]:flex-row"
      dir="rtl"
    >
      <main className="min-w-0 flex-1 overflow-y-auto p-5 pb-21.5 min-[900px]:px-5 min-[900px]:pb-5">
        <HashRouter>
          <Routes>
            <Route path="/" element={<ChaptersIndexPage />} />
            <Route path="/:pageId" element={<ReadPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </main>
    </div>
  );
};

export default App;
