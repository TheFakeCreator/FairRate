import React, { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { LayoutDashboard, Sliders, Settings, Star, Search, Plus, Trash2, Save, Film, RefreshCw, Users, AlertCircle, Edit2, X, Upload, TrendingUp } from 'lucide-react'
import { getAllRatings, getPresets, savePresets, pullFromCloud, pushToCloud, searchUser, toggleFollow, getFollowing, deleteRating, batchImportIMDbRatings } from '../lib/storage'
import { signInWithGoogle, signOut, getUser } from '../lib/auth'
import AnalyticsTab from './AnalyticsTab'
import '../content/styles.css'

const DEFAULT_ASPECTS_META = {
  enjoyment: { label: 'Enjoyment & Pacing', desc: 'How much fun was it to watch?' },
  story: { label: 'Story & Plot', desc: 'Writing, structure, and coherence.' },
  characters: { label: 'Characters & Acting', desc: 'Performances and character arcs.' },
  technical: { label: 'Technical Execution', desc: 'Cinematography, sound, VFX.' },
  emotional: { label: 'Emotional Impact', desc: 'Did it make you feel something?' },
}

function OptionsPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [ratings, setRatings] = useState([])
  const [presets, setPresets] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState([])
  const [friendSearchEmail, setFriendSearchEmail] = useState('')
  const [friendSearchResult, setFriendSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')
  const [editingAspect, setEditingAspect] = useState(null)
  
  const fileInputRef = useRef(null)
  const [importProgress, setImportProgress] = useState(null)

  useEffect(() => {
    // Check for updates
    async function checkForUpdates() {
      try {
        const response = await fetch('https://api.github.com/repos/TheFakeCreator/FairRate/releases/latest')
        if (response.ok) {
          const data = await response.json()
          const latest = data.tag_name.replace('v', '')
          const current = chrome.runtime.getManifest().version
          
          // Simple semantic version comparison (assuming format x.y.z)
          if (latest !== current && latest > current) {
            setLatestVersion(latest)
            setUpdateAvailable(true)
          }
        }
      } catch (e) {
        console.error("Update check failed:", e)
      }
    }
    checkForUpdates()
  }, [])

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [rData, pData, userData, followingData] = await Promise.all([
        getAllRatings(),
        getPresets(),
        getUser(),
        getFollowing()
      ])
      setRatings(rData)
      setPresets(pData)
      setUser(userData)
      setFollowing(followingData)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSignIn = async () => {
    try {
      const userData = await signInWithGoogle()
      setUser(userData)
      // First, smartly merge any existing cloud data down to local
      await pullFromCloud()
      // Then, push the merged local data back to the cloud
      await pushToCloud()
      
      // Update the UI with the merged data
      const [rData, pData] = await Promise.all([
        getAllRatings(),
        getPresets()
      ])
      setRatings(rData)
      setPresets(pData)
    } catch (error) {
      alert('Sign in failed. Check console for details.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setUser(null)
  }

  const handleForceSync = async () => {
    setLoading(true)
    const success = await pullFromCloud()
    if (success) {
      const [rData, pData] = await Promise.all([
        getAllRatings(),
        getPresets()
      ])
      setRatings(rData)
      setPresets(pData)
    } else {
      alert("Failed to sync from cloud.")
    }
    setLoading(false)
  }

  const handleSavePreset = async (presetId, newWeights, newMeta = null) => {
    const updated = presets.map(p => {
      if (p.id === presetId) {
        const payload = { ...p, weights: newWeights }
        if (newMeta !== null) payload.aspectMeta = newMeta
        return payload
      }
      return p
    })
    setPresets(updated)
    await savePresets(updated)
  }

  const handleAddPreset = async () => {
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: 'New Custom Preset',
      weights: { story: 1, enjoyment: 1, characters: 1, technical: 1, emotional: 1 }
    }
    const updated = [...presets, newPreset]
    setPresets(updated)
    await savePresets(updated)
  }

  const handleDeletePreset = async (presetId) => {
    if (presets.length <= 1) {
      alert("You must have at least one preset!")
      return
    }
    const updated = presets.filter(p => p.id !== presetId)
    setPresets(updated)
    await savePresets(updated)
  }

  const handleRenamePreset = async (presetId, newName) => {
    const updated = presets.map(p => p.id === presetId ? { ...p, name: newName } : p)
    setPresets(updated)
    await savePresets(updated)
  }

  const handleAddAspect = async (presetId, aspectName) => {
    const cleanName = aspectName.trim();
    if (!cleanName) return;
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const newId = `aspect_${Date.now()}`;
    const newWeights = { ...preset.weights, [newId]: 1 };
    const newMeta = { ...(preset.aspectMeta || {}), [newId]: { label: cleanName, desc: 'Custom Aspect' } };
    
    await handleSavePreset(presetId, newWeights, newMeta);
  }

  const handleRemoveAspect = async (presetId, aspectName) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    const newWeights = { ...preset.weights };
    delete newWeights[aspectName];
    
    if (Object.keys(newWeights).length === 0) {
      alert("A preset must have at least one aspect.");
      return;
    }
    
    const newMeta = { ...(preset.aspectMeta || {}) };
    delete newMeta[aspectName];
    
    await handleSavePreset(presetId, newWeights, newMeta);
  }

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

  const filteredRatings = ratings.filter(r => (r.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()))

  return (
    <div className="flex h-screen bg-imdb-dark text-white font-sans selection:bg-imdb-yellow selection:text-black">
      {/* Sidebar */}
      <div className="w-64 bg-imdb-darker border-r border-imdb-border flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-imdb-border">
          <img src="/icons/icon48.png" className="w-8 h-8" alt="FairRate" />
          <h1 className="text-2xl font-black tracking-wide">FairRate</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${activeTab === 'dashboard' ? 'bg-imdb-border text-imdb-yellow' : 'text-gray-400 hover:bg-imdb-border/50 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Rating History
          </button>
          <button 
            onClick={() => setActiveTab('presets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${activeTab === 'presets' ? 'bg-imdb-border text-imdb-yellow' : 'text-gray-400 hover:bg-imdb-border/50 hover:text-white'}`}
          >
            <Sliders className="w-5 h-5" />
            Custom Presets
          </button>
          <button 
            onClick={() => setActiveTab('friends')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${activeTab === 'friends' ? 'bg-imdb-border text-imdb-yellow' : 'text-gray-400 hover:bg-imdb-border/50 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
            Friends
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${activeTab === 'analytics' ? 'bg-imdb-border text-imdb-yellow' : 'text-gray-400 hover:bg-imdb-border/50 hover:text-white'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Insights
          </button>
        </nav>

        {/* User Auth Section */}
        <div className="p-4 mt-auto border-t border-imdb-border">
          {user ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {user.picture ? (
                  <img src={user.picture} className="w-10 h-10 rounded-full border border-imdb-border" alt="Profile" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-imdb-border flex items-center justify-center text-white font-bold">
                    {user.name ? user.name[0] : '?'}
                  </div>
                )}
                <div className="overflow-hidden flex-1">
                  <div className="text-sm font-bold truncate text-white">{user.name}</div>
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleForceSync}
                  className="flex flex-1 justify-center items-center gap-1 text-xs font-bold bg-imdb-yellow text-black py-2 rounded-md hover:bg-[#d8ad15] transition-colors"
                  title="Pull latest from Cloud"
                >
                  <RefreshCw className="w-3 h-3" /> Sync
                </button>
                <button 
                  onClick={handleSignOut}
                  className="flex-1 text-center text-xs font-bold bg-imdb-border text-gray-300 py-2 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 text-center font-medium">Sign in to backup & sync your data to the cloud</p>
              <button 
                onClick={handleSignIn}
                className="w-full flex justify-center items-center gap-2 bg-white text-black text-sm font-bold py-2.5 rounded-md hover:bg-gray-200 transition-colors shadow-sm"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#1a1a1a] flex flex-col">
        {updateAvailable && (
          <div className="bg-gradient-to-r from-imdb-yellow/20 to-transparent border-b border-imdb-yellow/30 px-8 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-imdb-yellow shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">Update Available!</p>
                <p className="text-xs text-gray-400">FairRate v{latestVersion} is out now. You are currently on v{chrome.runtime.getManifest().version}.</p>
              </div>
            </div>
            <a 
              href="https://TheFakeCreator.github.io/FairRate/" 
              target="_blank"
              rel="noreferrer"
              className="bg-imdb-yellow text-black px-4 py-2 rounded-md font-bold text-xs hover:bg-[#d8ad15] transition-colors whitespace-nowrap"
            >
              Download Update
            </a>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-imdb-yellow"></div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="p-8 max-w-7xl mx-auto space-y-8">
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
                      <div className="flex justify-between items-start mb-4 gap-2 pr-6">
                        <a href={`https://www.imdb.com/title/${r.movieId}/`} target="_blank" rel="noreferrer" className="text-lg font-bold hover:text-imdb-yellow transition-colors line-clamp-2 leading-tight">
                          {r.title}
                        </a>
                        <div className="bg-imdb-darker px-3 py-2 rounded-lg border border-imdb-border text-center shrink-0">
                          <div className="text-2xl font-black text-white leading-none">{r.overall}</div>
                          <div className="text-[10px] text-imdb-yellow uppercase font-bold tracking-wider mt-1">Score</div>
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
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab ratings={ratings} />
        ) : activeTab === 'presets' ? (
          <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Custom Presets</h2>
                <p className="text-gray-400 mt-2">Create custom weight multipliers for different genres or moods.</p>
              </div>
              <button 
                onClick={handleAddPreset}
                className="flex items-center gap-2 bg-imdb-yellow text-black px-6 py-2 rounded-md font-bold hover:bg-[#d8ad15] transition-colors"
              >
                <Plus className="w-5 h-5" /> Add Preset
              </button>
            </div>

            <div className="space-y-6">
              {presets.map(preset => (
                <div key={preset.id} className="bg-imdb-dark border border-imdb-border rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6 border-b border-imdb-border pb-4">
                    <input 
                      type="text" 
                      value={preset.name}
                      onChange={(e) => handleRenamePreset(preset.id, e.target.value)}
                      className="bg-transparent text-2xl font-bold focus:outline-none focus:border-b-2 focus:border-imdb-yellow w-1/2"
                    />
                    <button 
                      onClick={() => handleDeletePreset(preset.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors p-2"
                      title="Delete Preset"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {Object.entries(preset.weights).map(([aspect, weight]) => {
                      const meta = preset.aspectMeta?.[aspect];
                      const displayLabel = meta ? meta.label : aspect;
                      
                      return (
                      <div key={aspect} className="space-y-2 group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <label className="capitalize font-medium text-gray-300 truncate max-w-[180px]" title={displayLabel}>{displayLabel} Weight</label>
                            <button 
                              onClick={() => {
                                setEditingAspect({ 
                                  presetId: preset.id, 
                                  id: aspect, 
                                  label: displayLabel, 
                                  desc: meta?.desc || '' 
                                })
                              }}
                              className="text-gray-600 hover:text-imdb-yellow opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-imdb-yellow/10"
                              title="Edit Aspect"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleRemoveAspect(preset.id, aspect)}
                              className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 rounded hover:bg-red-500/10"
                              title="Remove Aspect"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-mono text-imdb-yellow font-bold bg-imdb-darker px-2 py-1 rounded text-sm">
                            x{weight.toFixed(1)}
                          </span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="3" step="0.1" 
                          value={weight}
                          onChange={(e) => handleSavePreset(preset.id, { ...preset.weights, [aspect]: parseFloat(e.target.value) })}
                          className="w-full accent-imdb-yellow"
                        />
                        <div className="flex justify-between text-xs text-gray-500 font-mono">
                          <span>0x (Ignore)</span>
                          <span>1x (Normal)</span>
                          <span>3x (Critical)</span>
                        </div>
                      </div>
                    )})}
                  </div>

                  {/* Add Custom Aspect */}
                  <div className="mt-8 pt-6 border-t border-imdb-border flex items-center gap-3">
                    <input 
                      type="text"
                      id={`new-aspect-${preset.id}`}
                      placeholder="New aspect (e.g. Cinematography)"
                      className="bg-imdb-darker border border-imdb-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-imdb-yellow flex-1 max-w-[250px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddAspect(preset.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const el = document.getElementById(`new-aspect-${preset.id}`);
                        handleAddAspect(preset.id, el.value);
                        el.value = '';
                      }}
                      className="text-sm font-bold bg-imdb-border text-gray-300 px-4 py-2 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      Add Custom Aspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'friends' ? (
          <div className="p-8 max-w-5xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold">Follow Friends</h2>
            
            {!user ? (
              <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 text-center text-gray-400">
                You must sign in to use the social features.
              </div>
            ) : (
              <>
                <div className="bg-imdb-dark border border-imdb-border rounded-xl p-6 shadow-lg space-y-6">
                  <div className="flex gap-4">
                    <input 
                      type="email" 
                      placeholder="Friend's Google Email..." 
                      className="flex-1 bg-imdb-darker border border-imdb-border rounded-md px-4 py-2 focus:outline-none focus:border-imdb-yellow"
                      value={friendSearchEmail}
                      onChange={e => setFriendSearchEmail(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        if (!friendSearchEmail.trim()) return;
                        setSearchError(''); setFriendSearchResult(null);
                        const res = await searchUser(friendSearchEmail.trim());
                        if (res) setFriendSearchResult(res);
                        else setSearchError('User not found. Make sure they have signed into FairRate.');
                      }}
                      className="bg-imdb-yellow text-black font-bold px-6 py-2 rounded-md hover:bg-[#d8ad15]"
                    >Search</button>
                  </div>
                  {searchError && <p className="text-red-500 text-sm font-bold">{searchError}</p>}
                  {friendSearchResult && (
                    <div className="flex items-center justify-between p-4 bg-imdb-darker border border-imdb-border rounded-lg">
                      <div className="flex items-center gap-3">
                        {friendSearchResult.picture ? (
                          <img src={friendSearchResult.picture} className="w-10 h-10 rounded-full" alt="Profile" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-imdb-border flex items-center justify-center text-white font-bold">{friendSearchResult.name[0]}</div>
                        )}
                        <div>
                          <div className="font-bold text-white">{friendSearchResult.name}</div>
                          <div className="text-sm text-gray-400">{friendSearchResult.email}</div>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          const res = await toggleFollow(friendSearchResult._id);
                          if (res) {
                            const newFollowing = await getFollowing();
                            setFollowing(newFollowing);
                          }
                        }}
                        className={`${following.some(f => f._id === friendSearchResult._id) ? 'bg-imdb-border text-gray-300' : 'bg-white text-black'} font-bold px-4 py-2 rounded-md transition-colors`}
                      >
                        {following.some(f => f._id === friendSearchResult._id) ? 'Unfollow' : 'Follow'}
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-2xl font-bold mt-12 mb-6">Following</h3>
                <div className="space-y-4">
                  {following.length === 0 ? (
                    <p className="text-gray-500">You aren't following anyone yet.</p>
                  ) : following.map(friend => (
                    <div key={friend._id} className="flex items-center justify-between p-4 bg-imdb-dark border border-imdb-border rounded-lg">
                      <div className="flex items-center gap-3">
                        {friend.picture ? (
                          <img src={friend.picture} className="w-10 h-10 rounded-full" alt="Profile" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-imdb-border flex items-center justify-center text-white font-bold">{friend.name[0]}</div>
                        )}
                        <div>
                          <div className="font-bold text-white">{friend.name}</div>
                          <div className="text-sm text-gray-400">{friend.email}</div>
                        </div>
                      </div>
                      <button 
                        onClick={async () => {
                          const res = await toggleFollow(friend._id);
                          if (res) {
                            const newFollowing = await getFollowing();
                            setFollowing(newFollowing);
                          }
                        }}
                        className="bg-imdb-border text-gray-300 font-bold px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Unfollow
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Edit Aspect Modal */}
      {editingAspect && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-imdb-dark border border-imdb-border rounded-xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">Edit Aspect</h3>
              <button onClick={() => setEditingAspect(null)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input 
                  type="text" 
                  value={editingAspect.label}
                  onChange={e => setEditingAspect({...editingAspect, label: e.target.value})}
                  className="w-full bg-imdb-darker border border-imdb-border rounded-md px-4 py-2 focus:outline-none focus:border-imdb-yellow text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description <span className="text-gray-600">(Optional)</span></label>
                <textarea 
                  value={editingAspect.desc}
                  onChange={e => setEditingAspect({...editingAspect, desc: e.target.value})}
                  rows={2}
                  className="w-full bg-imdb-darker border border-imdb-border rounded-md px-4 py-2 focus:outline-none focus:border-imdb-yellow text-white resize-none text-sm"
                  placeholder="e.g. Performances and character arcs."
                />
              </div>
              <button 
                onClick={async () => {
                  const preset = presets.find(p => p.id === editingAspect.presetId)
                  if (!preset) return
                  const newMeta = { ...(preset.aspectMeta || {}) }
                  newMeta[editingAspect.id] = { label: editingAspect.label.trim() || editingAspect.id, desc: editingAspect.desc.trim() }
                  await handleSavePreset(preset.id, preset.weights, newMeta)
                  setEditingAspect(null)
                }}
                className="w-full bg-imdb-yellow text-black font-bold py-2.5 rounded-md hover:bg-[#d8ad15] transition-colors mt-2"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overlay */}
      {importProgress && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-2xl max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-imdb-darker border-t-imdb-yellow rounded-full animate-spin"></div>
            <h3 className="font-bold text-xl mb-2">Importing Ratings</h3>
            <p className="text-gray-400 text-sm mb-6">Parsing and syncing your IMDb history...</p>
            
            <div className="w-full bg-imdb-darker rounded-full h-3 mb-2 overflow-hidden">
              <div 
                className="bg-imdb-yellow h-3 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${importProgress.percent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 font-mono text-right">{importProgress.count} items processed</p>
          </div>
        </div>
      )}
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<OptionsPage />)
