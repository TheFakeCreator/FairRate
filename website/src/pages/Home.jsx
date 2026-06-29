import {
  Download,
  Star,
  Sliders,
  Share2,
  Layers,
  Cloud,
  Users,
  PieChart,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const handleDownload = () => {
    // Navigate to the installation instructions page
    navigate("/install");
  };

  return (
    <>
      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-imdb-yellow/10 border border-imdb-yellow/20 text-imdb-yellow text-sm font-bold tracking-wide uppercase mb-8">
          <Star className="w-4 h-4 fill-imdb-yellow" />
          v1.4.1 is out now!
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight leading-tight mb-8 max-w-4xl">
          Rate movies with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-imdb-yellow to-yellow-300">
            Context
          </span>
          .
        </h1>

        <p className="text-lg sm:text-xl md:text-2xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
          Tired of giving a flat "7/10" and forgetting why? FairRate replaces
          IMDb's default rating system with a beautiful, 5-aspect context-aware
          modal.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <a
            href="https://github.com/TheFakeCreator/FairRate/releases/latest/download/FairRate-v1.4.1.zip"
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 bg-imdb-yellow text-black px-8 py-4 rounded-xl font-bold text-lg tracking-wider hover:bg-[#d8ad15] transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(245,197,24,0.3)] w-full sm:w-auto"
          >
            <Download className="w-6 h-6 shrink-0" />
            Download for Chrome
          </a>
          <a
            href="https://github.com/TheFakeCreator/FairRate"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors w-full sm:w-auto"
          >
            View Source
          </a>
        </div>
      </main>

      {/* Showcase Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-20 border-t border-white/10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Your Ratings, Visualized.
            </h2>
            <div className="space-y-6">
              <Feature
                icon={<Layers />}
                title="5-Aspect Rating"
                desc="Rate based on Enjoyment, Story, Characters, Technical Execution, and Emotional Impact."
              />
              <Feature
                icon={<Sliders />}
                title="Custom Presets"
                desc="Are you an action junkie? Set up genre presets that weigh 'Enjoyment' 2x higher than 'Story'."
              />
              <Feature
                icon={<PieChart />}
                title="Advanced Analytics"
                desc="Discover your movie taste profile with beautiful data visualizations like radar charts, scatter plots, and activity heatmaps!"
              />
              <Feature
                icon={<Share2 />}
                title="Export & Share"
                desc="Generate absolutely stunning glassmorphism rating cards to share on Twitter and Letterboxd."
              />
            </div>
          </div>
          <div className="relative h-[300px] sm:h-[400px] md:h-[600px] w-full flex items-center justify-center perspective-[1000px] mt-8 md:mt-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-imdb-yellow/20 to-transparent blur-[100px] -z-10 rounded-full"></div>

            <img
              src={`${import.meta.env.BASE_URL}images/fairrate_raja_harishchandra_horizontal.png`}
              alt="Horizontal Share Card"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ml-4 sm:ml-8 md:ml-16 mt-0 w-[85%] sm:w-[90%] md:w-[550px] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/10 -rotate-3 hover:rotate-0 hover:z-30 hover:scale-105 transition-all duration-500 z-10"
            />

            <img
              src={`${import.meta.env.BASE_URL}images/fairrate_raja_harishchandra_vertical.png`}
              alt="Vertical Share Card"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -ml-16 sm:-ml-20 md:-ml-32 mt-4 w-[45%] sm:w-[50%] md:w-[240px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 rotate-6 hover:rotate-0 hover:z-30 hover:scale-105 transition-all duration-500 z-20"
            />
          </div>
        </div>
      </section>

      {/* Seamless Integration Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6">
            Seamless IMDb Integration.
          </h2>
          <p className="text-lg md:text-xl text-gray-400">
            FairRate lives directly inside your IMDb pages. It replaces the
            native 1-10 star clicker but still syncs your final score to your
            official account in the background.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="bg-[#111] rounded-3xl p-6 md:p-8 border border-white/5 hover:border-imdb-yellow/20 transition-colors group">
            <div className="overflow-hidden rounded-xl mb-8 border border-white/10">
              <img
                src={`${import.meta.env.BASE_URL}images/heropage.png`}
                alt="IMDb Page Integration"
                className="w-full object-cover shadow-2xl group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">
              Native Injection
            </h3>
            <p className="text-gray-400 text-sm md:text-base">
              The new "Rate" button is injected perfectly into the IMDb UI so it
              feels completely natural and non-intrusive.
            </p>
          </div>
          <div className="bg-[#111] rounded-3xl p-6 md:p-8 border border-white/5 hover:border-imdb-yellow/20 transition-colors group">
            <div className="overflow-hidden rounded-xl mb-8 border border-white/10 bg-[#0a0a0a] flex items-center justify-center p-4">
              <img
                src={`${import.meta.env.BASE_URL}images/ratingmodal.png`}
                alt="Rating Modal"
                className="w-full max-w-[400px] object-cover shadow-2xl group-hover:scale-105 transition-transform duration-700 rounded-xl"
              />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">
              Contextual Modal
            </h3>
            <p className="text-gray-400 text-sm md:text-base">
              A beautiful, distraction-free modal that forces you to think
              critically about 5 distinct aspects of the film.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 border-t border-white/10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="order-2 md:order-1 relative">
            <div className="absolute inset-0 bg-gradient-to-bl from-imdb-yellow/20 to-transparent blur-[100px] -z-10 rounded-full"></div>
            <img
              src={`${import.meta.env.BASE_URL}images/dashboard.png`}
              alt="FairRate Dashboard"
              className="rounded-2xl border border-white/10 shadow-2xl relative z-10"
            />
            <img
              src={`${import.meta.env.BASE_URL}images/custompresets.png`}
              alt="Custom Presets"
              className="absolute -bottom-4 -right-2 md:-bottom-12 md:-right-8 w-[75%] md:w-2/3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-white/10 z-20 hover:-translate-y-4 transition-transform duration-500"
            />
          </div>
          <div className="order-1 md:order-2 space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight">
              Your Personal Movie Vault.
            </h2>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
              Every rating is saved to your local machine. Search, filter, and
              review your entire rating history right from the beautiful
              dark-mode extension dashboard.
            </p>
            <div className="space-y-6">
              <Feature
                icon={<Filter />}
                title="Advanced Filtering"
                desc="Effortlessly filter your rating history by Critic Bias (Underrated vs Overrated), Minimum Score, Date Range, and Custom Presets."
              />
              <Feature
                icon={<Cloud />}
                title="Cloud Sync Backup"
                desc="Sign in with Google to automatically backup and sync your ratings and presets across devices."
              />
              <Feature
                icon={<Users className="w-6 h-6" />}
                title="Follow Friends"
                desc="Follow your friends and instantly see what they rated the movie right inside the IMDb page!"
              />
              <Feature
                icon={<FileSpreadsheet />}
                title="IMDb CSV Importer"
                desc="Instantly migrate thousands of existing ratings into FairRate using IMDb's native CSV export."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 md:py-32 border-t border-white/10 bg-gradient-to-b from-transparent to-imdb-yellow/5">
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 md:mb-8">
            Ready to rate?
          </h2>
          <p className="text-lg md:text-2xl text-gray-400 mb-10 md:mb-12">
            Stop giving arbitrary numbers. Start rating with context.
          </p>
          <a
            href="https://github.com/TheFakeCreator/FairRate/releases/latest/download/FairRate-v1.4.0.zip"
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 bg-imdb-yellow text-black px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-black text-lg sm:text-xl tracking-wider hover:bg-[#d8ad15] transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(245,197,24,0.4)] w-full sm:w-auto"
          >
            <Download className="w-6 h-6 shrink-0" />
            Download FairRate v1.4.1
          </a>
        </div>
      </section>
    </>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-xl bg-imdb-yellow/10 border border-imdb-yellow/20 flex items-center justify-center text-imdb-yellow shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default Home;
