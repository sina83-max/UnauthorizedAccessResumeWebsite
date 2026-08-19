import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinderPage } from '@/app/pages/FinderPage';
import AdminPage from '@/app/pages/AdminPage';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const hour = new Date().getHours();
    return hour < 7 || hour >= 19;
  });

  const toggleDark = () => setIsDarkMode((prev) => !prev);

  return (
    <div className={`min-h-screen w-full select-none font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      {/* macOS Sequoia Wallpaper Background */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-all duration-700">
        {isDarkMode ? (
          <div className="absolute inset-0">
            {/* Dark night sky base */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#131833] to-[#1a1040]" />
            {/* Mountain silhouette — deep indigo/purple range */}
            <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#0d0b1a] via-[#1a1030] to-transparent" />
            {/* Warm sunset glow on horizon */}
            <div className="absolute bottom-[35%] left-0 right-0 h-[20%] bg-gradient-to-t from-[#2a1535]/60 via-[#4a2040]/30 to-transparent blur-[30px]" />
            {/* Purple mountain highlight */}
            <div className="absolute bottom-[20%] left-[5%] w-[40vw] h-[25vw] rounded-full bg-[#3b1f5e]/20 blur-[80px]" />
            {/* Subtle blue atmosphere */}
            <div className="absolute top-[10%] left-[20%] w-[60vw] h-[40vw] rounded-full bg-[#1a2555]/25 blur-[120px]" />
            {/* Stars — tiny glow dots */}
            <div className="absolute top-[8%] left-[15%] w-1 h-1 rounded-full bg-white/40" />
            <div className="absolute top-[12%] left-[65%] w-0.5 h-0.5 rounded-full bg-white/30" />
            <div className="absolute top-[5%] left-[40%] w-0.5 h-0.5 rounded-full bg-white/25" />
            <div className="absolute top-[15%] left-[80%] w-0.5 h-0.5 rounded-full bg-white/20" />
          </div>
        ) : (
          <div className="absolute inset-0">
            {/* Light daytime sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#5b8fd4] via-[#8fb8e8] to-[#c9ddf0]" />
            {/* Warm sunset horizon */}
            <div className="absolute bottom-[30%] left-0 right-0 h-[25%] bg-gradient-to-t from-[#e8b87a]/50 via-[#d49a6a]/30 to-transparent blur-[40px]" />
            {/* Mountain range — blue/purple silhouette */}
            <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-[#2a3050] via-[#3a4565]/80 to-transparent" />
            {/* Green foothills */}
            <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-gradient-to-t from-[#2d4a3a]/70 via-[#3a5a4a]/40 to-transparent" />
            {/* Cloud wisps */}
            <div className="absolute top-[15%] left-[10%] w-[40vw] h-[8vw] rounded-full bg-white/25 blur-[50px]" />
            <div className="absolute top-[25%] right-[5%] w-[35vw] h-[6vw] rounded-full bg-white/20 blur-[40px]" />
            {/* Sun glow */}
            <div className="absolute top-[8%] right-[20%] w-[20vw] h-[20vw] rounded-full bg-[#f5e6b8]/30 blur-[60px]" />
          </div>
        )}
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FinderPage isDarkMode={isDarkMode} onToggleDark={toggleDark} />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
