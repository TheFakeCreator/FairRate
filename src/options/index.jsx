import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { LayoutDashboard, Sliders, Settings, Star, Search, Plus, Trash2, Save, Film } from 'lucide-react'
import { getAllRatings, getPresets, savePresets } from '../lib/storage'
import '../content/styles.css'

function OptionsPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [ratings, setRatings] = useState([])
  const [presets, setPresets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const [rData, pData] = await Promise.all([
        getAllRatings(),
        getPresets()
      ])
      setRatings(rData)
      setPresets(pData)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSavePreset = async (presetId, newWeights) => {
    const updated = presets.map(p => p.id === presetId ? { ...p, weights: newWeights } : p)
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
    if (!aspectName.trim()) return;
    const cleanName = aspectName.trim().toLowerCase();
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // Default weight is 1
    const newWeights = { ...preset.weights, [cleanName]: 1 };
    await handleSavePreset(presetId, newWeights);
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
    await handleSavePreset(presetId, newWeights);
  }

  const filteredRatings = ratings.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))

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
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#1a1a1a]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-imdb-yellow"></div>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Your Movie Ratings</h2>
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

            {filteredRatings.length === 0 ? (
              <div className="text-center py-20 bg-imdb-dark rounded-xl border border-imdb-border">
                <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-300">No ratings found</h3>
                <p className="text-gray-500 mt-2">Go to IMDb and start rating movies!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatings.map(r => (
                  <div key={r.movieId} className="bg-imdb-dark border border-imdb-border rounded-xl shadow-lg flex hover:border-imdb-yellow/50 transition-colors overflow-hidden group">
                    {/* Full Height Poster */}
                    <div className="w-[120px] shrink-0 bg-[#222] border-r border-imdb-border relative flex items-center justify-center">
                      {r.posterUrl && !r.posterUrl.startsWith('data:image') ? (
                        <img src={r.posterUrl} className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" alt="Poster" />
                      ) : (
                        <Film className="w-10 h-10 text-gray-600" />
                      )}
                    </div>
                    
                    {/* Right Side Info */}
                    <div className="flex-1 flex flex-col p-5">
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <a href={`https://www.imdb.com/title/${r.movieId}/`} target="_blank" rel="noreferrer" className="text-lg font-bold hover:text-imdb-yellow transition-colors line-clamp-2 leading-tight">
                          {r.title}
                        </a>
                        <div className="bg-imdb-darker px-3 py-2 rounded-lg border border-imdb-border text-center shrink-0">
                          <div className="text-2xl font-black text-white leading-none">{r.overall}</div>
                          <div className="text-[10px] text-imdb-yellow uppercase font-bold tracking-wider mt-1">Score</div>
                        </div>
                      </div>
                      
                      <div className="mt-auto space-y-2 pt-4 border-t border-imdb-border">
                        {Object.entries(r.scores).map(([aspect, score]) => (
                          <div key={aspect} className="flex justify-between items-center text-xs">
                            <span className="capitalize text-gray-400">{aspect}</span>
                            <span className="font-mono font-bold text-gray-200">{score.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 max-w-5xl mx-auto space-y-8">
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
                    {Object.entries(preset.weights).map(([aspect, weight]) => (
                      <div key={aspect} className="space-y-2 group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <label className="capitalize font-medium text-gray-300">{aspect} Weight</label>
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
                    ))}
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
        )}
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<OptionsPage />)
