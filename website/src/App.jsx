import { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Install from "./pages/Install";

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
            <img
              src={`${import.meta.env.BASE_URL}icons/icon128.png`}
              className="w-10 h-10 group-hover:scale-110 transition-transform"
              alt="FairRate"
            />
            <span className="text-2xl font-black tracking-wide">FairRate</span>
          </Link>
          <div className="flex items-center gap-6">
            <a
              href="https://ko-fi.com/thefakecreator"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-white font-medium transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5 text-[#ff5e5b]"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-2.682.28-2.682.28l.236-3.568s1.614-.047 2.393-.034c1.336.038 2.699.072 2.24 3.322z" />
              </svg>
              Donate
            </a>
            <a
              href="https://github.com/TheFakeCreator/FairRate"
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-white font-medium transition-colors"
            >
              GitHub
            </a>
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
          <p className="mb-4">
            Built for movie lovers. Not affiliated with IMDb.
          </p>
          <div className="flex justify-center gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/install" className="hover:text-white transition-colors">
              Installation Guide
            </Link>
            <a
              href="https://ko-fi.com/thefakecreator"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors text-[#ff5e5b]"
            >
              Support via Ko-fi
            </a>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
