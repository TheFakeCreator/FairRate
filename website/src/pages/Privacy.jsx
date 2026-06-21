import React from 'react';

function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-black mb-6">Privacy Policy</h1>
        <p className="text-gray-400">Last updated: June 21, 2026</p>
      </div>

      <div className="space-y-8 text-lg text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
          <p>
            Welcome to FairRate. Your privacy is critically important to us. This Privacy Policy explains how FairRate collects, uses, and protects your information when you use our Chrome extension.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">2. Data Storage & Collection</h2>
          <p>
            <strong>FairRate stores all of your data locally on your device.</strong> 
            <br /><br />
            When you rate a movie using FairRate, the 5-aspect rating scores and any custom genre presets you create are stored directly within your browser using `IndexedDB`. 
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">3. No External Telemetry</h2>
          <p>
            FairRate does <strong>not</strong> collect telemetry, tracking data, or usage statistics. We do not transmit your movie ratings, your browsing history, or your personal information to any external servers. The extension only communicates with IMDb.com to sync your final average rating to your official IMDb account if you are logged in.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
          <p>
            FairRate interacts directly with IMDb to retrieve movie metadata (such as the poster image and title) and to submit your rating. Please refer to <a href="https://www.imdb.com/privacy" target="_blank" rel="noreferrer" className="text-imdb-yellow hover:underline">IMDb's Privacy Policy</a> for information on how they handle your data when using their website.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">5. Your Control</h2>
          <p>
            Because your data lives entirely on your machine, you have complete control over it. You can export your data as a JSON file at any time from the FairRate dashboard. You can also permanently delete all your data by clearing your browser's local storage or uninstalling the extension.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">6. Contact</h2>
          <p>
            If you have any questions about this Privacy Policy, you can reach out via our <a href="https://github.com/TheFakeCreator/FairRate" target="_blank" rel="noreferrer" className="text-imdb-yellow hover:underline">GitHub repository</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Privacy;
