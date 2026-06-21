import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Install from './pages/Install';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-imdb-yellow selection:text-black overflow-x-hidden relative flex flex-col">
        {/* Background ambient light */}
        <div className="fixed top-0 left-1/2 w-[800px] h-[800px] bg-imdb-yellow/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-0"></div>

        {/* Navigation */}
        <nav className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={`${import.meta.env.BASE_URL}icons/icon128.png`} className="w-10 h-10 group-hover:scale-110 transition-transform" alt="FairRate" />
            <span className="text-2xl font-black tracking-wide">FairRate</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="https://github.com/TheFakeCreator/FairRate" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white font-medium transition-colors">GitHub</a>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/install" element={<Install />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 py-8 text-center text-gray-500 text-sm mt-auto">
          <p className="mb-4">Built for movie lovers. Not affiliated with IMDb.</p>
          <div className="flex justify-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/install" className="hover:text-white transition-colors">Installation Guide</Link>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
