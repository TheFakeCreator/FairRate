import React, { useState, useRef } from 'react'
import { Upload, Search, Filter, Sliders, Star, Calendar, Activity, ArrowUpDown, Film, Trash2 } from 'lucide-react'
import { deleteRating, getAllRatings, batchImportIMDbRatings } from '../../lib/storage'

export default function DashboardTab({ ratings, setRatings, presets, DEFAULT_ASPECTS_META }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPresetId, setFilterPresetId] = useState('all')
  const [filterMinScore, setFilterMinScore] = useState('0')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [filterBias, setFilterBias] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [importProgress, setImportProgress] = useState(null)
  
  const fileInputRef = useRef(null)

  const handleDeleteRating = async (movieId) => {
    if (confirm("Are you sure you want to delete this rating? This will remove it from the cloud as well.")) {
      const success = await deleteRating(movieId);
      if (success) {
        setRatings(ratings.filter(r => r.movieId !== movieId));
      } else {
        alert("Failed to delete rating.");
      }
    }
  }

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      if (lines.length < 2) {
        alert("Invalid CSV file.");
        return;
      }

      const parseCSVRow = (str) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < str.length; i++) {
          const char = str[i];
          if (char === '"' && str[i+1] === '"') {
            cur += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur);
        return result;
      };

      const headers = parseCSVRow(lines[0].trim());
      const constIdx = headers.indexOf('Const');
      const ratingIdx = headers.indexOf('Your Rating');
      const titleIdx = headers.indexOf('Title');

      if (constIdx === -1 || ratingIdx === -1 || titleIdx === -1) {
        alert("Could not find required columns (Const, Your Rating, Title) in CSV.");
        return;
      }

      setImportProgress({ percent: 0, count: 0 });
      
      const parsedRatings = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = parseCSVRow(line);
        const movieId = cols[constIdx];
        const ratingStr = cols[ratingIdx];
        const title = cols[titleIdx];
        
        if (movieId && ratingStr) {
          const overall = parseFloat(ratingStr);
          if (!isNaN(overall)) {
            parsedRatings.push({ movieId, overall, title: title || 'Unknown Title' });
          }
        }
      }

      if (parsedRatings.length === 0) {
        alert("No valid ratings found in CSV.");
        setImportProgress(null);
        return;
      }

      const importedCount = await batchImportIMDbRatings(parsedRatings, (percent, count) => {
        setImportProgress({ percent, count });
      });

      if (importedCount !== -1) {
        alert(`Successfully imported ${importedCount} new ratings!`);
        const rData = await getAllRatings();
        setRatings(rData);
      } else {
        alert("An error occurred during import.");
      }
      
      setImportProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  const filteredRatings = ratings.filter(r => {
    // 1. Search filter
    if (searchQuery && !(r.title || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // 2. Preset filter
    if (filterPresetId !== 'all' && (r.presetId || 'default') !== filterPresetId) return false;
    
    // 3. Min Score filter
    if (filterMinScore !== '0' && Number(r.overall) < Number(filterMinScore)) return false;
    
    // 4. Date Range filter
    if (filterDateRange !== 'all') {
      const ratingDate = r.updatedAt ? new Date(r.updatedAt) : new Date(0);
      const now = new Date();
      if (filterDateRange === '7days') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        if (ratingDate < sevenDaysAgo) return false;
      } else if (filterDateRange === '30days') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        if (ratingDate < thirtyDaysAgo) return false;
      } else if (filterDateRange === 'thisYear') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        if (ratingDate < startOfYear) return false;
      }
    }
    
    // 5. Bias filter
    if (filterBias !== 'all') {
      if (!r.publicIMDbRating) return false;
      const delta = Number(r.overall) - r.publicIMDbRating;
      if (filterBias === 'underrated' && delta < 0.1) return false;
      if (filterBias === 'overrated' && delta > -0.1) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    if (sortBy === 'date_asc') return new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0);
    if (sortBy === 'score_desc') return Number(b.overall) - Number(a.overall);
    if (sortBy === 'score_asc') return Number(a.overall) - Number(b.overall);
    if (sortBy === 'title_asc') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Your Movie Ratings</h2>
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-imdb-darker border border-imdb-border text-gray-300 px-4 py-2 rounded-full hover:text-imdb-yellow hover:border-imdb-yellow transition-colors text-sm font-bold"
            title="Import from IMDb CSV"
          >
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search movies..." 
              className="w-full bg-imdb-dark border border-imdb-border rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-imdb-yellow transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {importProgress && (
        <div className="bg-imdb-dark border border-imdb-border rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Importing ratings from CSV...</span>
            <span>{Math.round(importProgress.percent)}% ({importProgress.count} imported)</span>
          </div>
          <div className="w-full bg-imdb-darker rounded-full h-2.5">
            <div className="bg-imdb-yellow h-2.5 rounded-full transition-all duration-300" style={{ width: `${importProgress.percent}%` }}></div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-imdb-dark border border-imdb-border rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400 font-medium text-sm border-r border-imdb-border pr-4 mr-2">
          <Filter className="w-4 h-4" /> Filters
        </div>
        
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gray-500" />
          <select 
            value={filterPresetId} 
            onChange={e => setFilterPresetId(e.target.value)}
            className="bg-imdb-darker border border-imdb-border text-gray-300 text-sm rounded-lg focus:ring-imdb-yellow focus:border-imdb-yellow p-2 outline-none appearance-none pr-8 cursor-pointer"
          >
            <option value="all">All Presets</option>
            {presets.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            <option value="default">Default</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-gray-500" />
          <select 
            value={filterMinScore} 
            onChange={e => setFilterMinScore(e.target.value)}
            className="bg-imdb-darker border border-imdb-border text-gray-300 text-sm rounded-lg focus:ring-imdb-yellow focus:border-imdb-yellow p-2 outline-none appearance-none pr-8 cursor-pointer"
          >
            <option value="0">Any Score</option>
            <option value="9">9+ Masterpiece</option>
            <option value="8">8+ Great</option>
            <option value="7">7+ Good</option>
            <option value="5">5+ Average</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select 
            value={filterDateRange} 
            onChange={e => setFilterDateRange(e.target.value)}
            className="bg-imdb-darker border border-imdb-border text-gray-300 text-sm rounded-lg focus:ring-imdb-yellow focus:border-imdb-yellow p-2 outline-none appearance-none pr-8 cursor-pointer"
          >
            <option value="all">Any Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="thisYear">This Year</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <select 
            value={filterBias} 
            onChange={e => setFilterBias(e.target.value)}
            className="bg-imdb-darker border border-imdb-border text-gray-300 text-sm rounded-lg focus:ring-imdb-yellow focus:border-imdb-yellow p-2 outline-none appearance-none pr-8 cursor-pointer"
          >
            <option value="all">Any Bias</option>
            <option value="underrated">Underrated (You &gt; IMDb)</option>
            <option value="overrated">Overrated (You &lt; IMDb)</option>
          </select>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className="bg-imdb-darker border border-imdb-border text-gray-300 text-sm rounded-lg focus:ring-imdb-yellow focus:border-imdb-yellow p-2 outline-none appearance-none pr-8 cursor-pointer font-bold text-imdb-yellow"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="score_desc">Highest Rated</option>
            <option value="score_asc">Lowest Rated</option>
            <option value="title_asc">Title (A-Z)</option>
          </select>
        </div>
      </div>

      {filteredRatings.length === 0 ? (
        <div className="text-center py-20 bg-imdb-dark rounded-xl border border-imdb-border">
          <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300">No ratings found</h3>
          <p className="text-gray-500 mt-2">Go to IMDb and start rating movies!</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
          {filteredRatings.map(r => (
            <div key={r.movieId} className="break-inside-avoid mb-6 bg-imdb-dark border border-imdb-border rounded-xl shadow-lg flex hover:border-imdb-yellow/50 transition-colors overflow-hidden group h-min">
              {/* Full Height Poster */}
              <div className="w-[120px] shrink-0 bg-[#222] border-r border-imdb-border relative flex items-center justify-center">
                {r.posterUrl && !r.posterUrl.startsWith('data:image') ? (
                  <img src={r.posterUrl} className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" alt="Poster" />
                ) : (
                  <Film className="w-10 h-10 text-gray-600" />
                )}
              </div>
              
              {/* Right Side Info */}
              <div className="flex-1 flex flex-col p-5 relative">
                <button 
                  onClick={() => handleDeleteRating(r.movieId)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-full hover:bg-red-500/10 z-10"
                  title="Delete Rating"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex justify-between items-start mb-4 gap-2">
                  <a href={`https://www.imdb.com/title/${r.movieId}/`} target="_blank" rel="noreferrer" className="text-lg font-bold hover:text-imdb-yellow transition-colors line-clamp-2 leading-tight">
                    {r.title}
                  </a>
                  <div className="bg-imdb-darker px-3 py-2 rounded-lg border border-imdb-border text-center shrink-0 flex flex-col items-center justify-center min-w-[64px]">
                    <div className="text-2xl font-black text-white leading-none">{r.overall}</div>
                    <div className="text-[10px] text-imdb-yellow uppercase font-bold tracking-wider mt-1">Score</div>
                    {(() => {
                      if (!r.publicIMDbRating) return null;
                      const delta = Number(r.overall) - r.publicIMDbRating;
                      if (Math.abs(delta) < 0.1) return null;
                      const isPos = delta > 0;
                      return (
                        <div className={`text-[10px] font-bold mt-1 bg-[#111] px-1.5 rounded ${isPos ? 'text-green-500' : 'text-red-500'}`} title="Difference from IMDb Rating">
                          {isPos ? '+' : ''}{delta.toFixed(1)}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                
                <div className="mt-auto space-y-2 pt-4 border-t border-imdb-border">
                  {(r.weights ? Object.keys(r.weights) : Object.keys(r.scores)).map(aspect => {
                    const score = r.scores[aspect];
                    if (score === undefined) return null;
                    
                    // Resolve label
                    let displayLabel = aspect;
                    const preset = presets.find(p => p.id === r.presetId);
                    if (preset && preset.aspectMeta && preset.aspectMeta[aspect]) {
                      displayLabel = preset.aspectMeta[aspect].label;
                    } else if (DEFAULT_ASPECTS_META[aspect]) {
                      displayLabel = DEFAULT_ASPECTS_META[aspect].label;
                    }
                    
                    return (
                      <div key={aspect} className="flex justify-between items-center text-xs">
                        <span className="capitalize text-gray-400">{displayLabel}</span>
                        <span className="font-mono font-bold text-gray-200">{score.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
