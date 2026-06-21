import React from 'react';
import { Download, PackageOpen, Settings, Plug } from 'lucide-react';

function Install() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-6">Installation Guide</h1>
        <p className="text-xl text-gray-400">
          Since FairRate is not yet on the Chrome Web Store, you'll need to load it manually. It only takes 30 seconds!
        </p>
      </div>

      <div className="space-y-12">
        <Step 
          number="1"
          icon={<PackageOpen className="w-8 h-8" />}
          title="Extract the ZIP file"
          desc="Locate the FairRate ZIP file you just downloaded and extract its contents to a folder on your computer."
        />
        
        <Step 
          number="2"
          icon={<Settings className="w-8 h-8" />}
          title="Open Chrome Extensions"
          desc="In your Chrome browser, type chrome://extensions/ into the URL bar and press Enter."
        />

        <Step 
          number="3"
          icon={<Plug className="w-8 h-8" />}
          title="Enable Developer Mode"
          desc="In the top right corner of the Extensions page, toggle on 'Developer mode'."
        />

        <Step 
          number="4"
          icon={<Download className="w-8 h-8" />}
          title="Load Unpacked"
          desc="Click the 'Load unpacked' button that appears in the top left. Select the extracted FairRate folder from Step 1."
        />
      </div>

      <div className="mt-20 p-8 rounded-2xl bg-imdb-yellow/10 border border-imdb-yellow/20 text-center">
        <h3 className="text-2xl font-bold text-imdb-yellow mb-4">You're all set! 🎉</h3>
        <p className="text-gray-300">
          Head over to <a href="https://www.imdb.com" target="_blank" rel="noreferrer" className="text-white font-bold underline underline-offset-4 hover:text-imdb-yellow transition-colors">IMDb</a> and check out any movie page to see FairRate in action!
        </p>
      </div>
    </div>
  );
}

function Step({ number, icon, title, desc }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center p-8 rounded-2xl bg-[#111] border border-white/5 hover:border-white/20 transition-colors">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 relative text-white">
        <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-imdb-yellow text-black flex items-center justify-center font-black text-lg">
          {number}
        </span>
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 text-lg">{desc}</p>
      </div>
    </div>
  );
}

export default Install;
