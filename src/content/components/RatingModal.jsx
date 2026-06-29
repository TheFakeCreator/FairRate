import React, { useState, useEffect, useRef } from 'react'
import { X, Star, Save, Check, Download, Share2, LayoutPanelLeft, LayoutPanelTop, ChevronLeft } from 'lucide-react'
import { saveRating, getRating, getPresets, getFriendsRatings } from '../../lib/storage'
import { cn } from '../../lib/utils'
import { toPng } from 'html-to-image'

const DEFAULT_ASPECTS_META = {
  enjoyment: { label: 'Enjoyment & Pacing', desc: 'How much fun was it to watch?' },
  story: { label: 'Story & Plot', desc: 'Writing, structure, and coherence.' },
  characters: { label: 'Characters & Acting', desc: 'Performances and character arcs.' },
  technical: { label: 'Technical Execution', desc: 'Cinematography, sound, VFX.' },
  emotional: { label: 'Emotional Impact', desc: 'Did it make you feel something?' },
}

function StarRating({ value, onChange }) {
  const [hoverValue, setHoverValue] = useState(0)
  
  return (
    <div className="flex justify-between w-full" onMouseLeave={() => setHoverValue(0)}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          className="focus:outline-none transform transition-transform hover:scale-110"
          onMouseEnter={() => setHoverValue(star)}
          onClick={() => onChange(star)}
        >
          <Star 
            className={cn(
              "w-6 h-6 transition-colors duration-150",
              (hoverValue || value) >= star 
                ? "text-[#f5c518] fill-[#f5c518]" 
                : "text-[#2b2b2b]"
            )} 
          />
        </button>
      ))}
    </div>
  )
}

export default function RatingModal({ movieId, title, posterUrl, onClose }) {
  const [scores, setScores] = useState({
    enjoyment: 5,
    story: 5,
    characters: 5,
    technical: 5,
    emotional: 5,
  })
  const [presets, setPresets] = useState([])
  const [selectedPresetId, setSelectedPresetId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [friendsRatings, setFriendsRatings] = useState([])
  
  const [shareMode, setShareMode] = useState(false)
  const [shareLayout, setShareLayout] = useState('horizontal')
  const [isExporting, setIsExporting] = useState(false)
  
  const cardRef = useRef(null)

  useEffect(() => {
    async function loadData() {
      const pData = await getPresets()
      setPresets(pData)
      if (pData.length > 0) {
        setSelectedPresetId(pData[0].id)
      }

      const data = await getRating(movieId)
      if (data) {
        if (data.scores) setScores(data.scores)
        if (data.presetId && pData.find(p => p.id === data.presetId)) {
          setSelectedPresetId(data.presetId)
        }
      }

      const friendsData = await getFriendsRatings(movieId)
      setFriendsRatings(friendsData)
    }
    if (movieId) loadData()
  }, [movieId])

  const activePreset = presets.find(p => p.id === selectedPresetId) || presets[0]
  const weights = activePreset ? activePreset.weights : { enjoyment: 1, story: 1, characters: 1, technical: 1, emotional: 1 }

  // Build the dynamic aspects list based on the current preset's weights
  const currentAspects = Object.keys(weights).map(id => {
    // 1. Prioritize explicitly set custom metadata (if it exists)
    if (activePreset && activePreset.aspectMeta && activePreset.aspectMeta[id]) {
      return { 
        id, 
        label: activePreset.aspectMeta[id].label, 
        desc: activePreset.aspectMeta[id].desc !== undefined ? activePreset.aspectMeta[id].desc : 'Custom Aspect'
      }
    }
    
    // 2. Fallback to default IMDb aspects if it matches an internal ID
    if (DEFAULT_ASPECTS_META[id]) {
      return { id, ...DEFAULT_ASPECTS_META[id] }
    }
    
    // 3. Ultimate fallback for legacy custom aspects that have no metadata
    return { 
      id, 
      label: id.charAt(0).toUpperCase() + id.slice(1), 
      desc: 'Custom Aspect' 
    }
  })

  // Ensure all aspects in the current preset have a default score if not already rated
  useEffect(() => {
    let needsUpdate = false
    const newScores = { ...scores }
    for (const aspectId of Object.keys(weights)) {
      if (newScores[aspectId] === undefined) {
        newScores[aspectId] = 5 // Default score
        needsUpdate = true
      }
    }
    if (needsUpdate) {
      setScores(newScores)
    }
  }, [weights])

  const handleScoreChange = (aspectId, value) => {
    setScores(prev => ({ ...prev, [aspectId]: Number(value) }))
    setIsSaved(false)
  }

  const calculateOverall = () => {
    let totalScore = 0
    let totalWeight = 0
    for (const aspect in weights) {
      const score = scores[aspect] !== undefined ? scores[aspect] : 5
      const weight = weights[aspect]
      totalScore += score * weight
      totalWeight += weight
    }
    const avg = totalWeight > 0 ? (totalScore / totalWeight) : 0
    return avg.toFixed(1)
  }

  const overallScore = calculateOverall()

  const syncToIMDb = async (score) => {
    try {
      let rateBtn = null
      
      // If we are rating a movie from a list, the native button is hidden next to our wrapper
      const listWrapper = document.getElementById(`fairrate-list-${movieId}`)
      if (listWrapper && listWrapper.previousElementSibling) {
        rateBtn = listWrapper.previousElementSibling
      } else {
        // Fallback to hero rating bar (only if we are actually on this movie's page)
        if (window.location.pathname.includes(movieId)) {
          const rateWrapper = document.querySelector(
            '[data-testid="hero-rating-bar__user-rating"], ' +
            '[data-testid="hero-rating-bar__user-rating__score"], ' +
            '.ipc-rating-star-group'
          )
          rateBtn = rateWrapper ? (rateWrapper.querySelector('button') || rateWrapper) : null
        }
      }

      if (!rateBtn) return

      rateBtn.click()
      await new Promise(r => setTimeout(r, 600)) // Wait for modal animation

      const starBtn = document.querySelector(`button[aria-label="Rate ${score}"]`)
      if (starBtn) {
        starBtn.click()
        await new Promise(r => setTimeout(r, 300))
        
        const submitBtn = Array.from(document.querySelectorAll('button')).find(
          b => b.innerText === 'Rate' && b.closest('.ipc-promptable-base__panel')
        )
        if (submitBtn) {
          submitBtn.click()
        }
      }
    } catch (e) {
      console.error("FairRate: Failed to auto-sync with IMDb rating", e)
    }
  }

  const getPublicIMDbRating = () => {
    try {
      if (window.location.pathname.includes(movieId)) {
        const heroRating = document.querySelector('[data-testid="hero-rating-bar__aggregate-rating__score"] > span:first-child');
        if (heroRating && !isNaN(Number(heroRating.innerText))) {
          return Number(heroRating.innerText);
        }
      }
      const listWrapper = document.getElementById(`fairrate-list-${movieId}`);
      if (listWrapper) {
        const listItem = listWrapper.closest('.ipc-metadata-list-summary-item');
        if (listItem) {
          const listRating = listItem.querySelector('.ipc-rating-star--rating');
          if (listRating && !isNaN(Number(listRating.innerText))) {
            return Number(listRating.innerText);
          }
        }
      }
    } catch (e) {
      console.error("FairRate: Failed to parse public IMDb rating", e);
    }
    return null;
  };

  const handleSave = async () => {
    setIsSaving(true)
    const publicIMDbRating = getPublicIMDbRating();

    await saveRating(movieId, {
      title,
      posterUrl,
      scores,
      overall: overallScore,
      presetId: selectedPresetId,
      presetName: activePreset.name,
      weights,
      publicIMDbRating
    })
    
    await syncToIMDb(Math.round(Number(overallScore)))

    setIsSaving(false)
    setIsSaved(true)
    setTimeout(onClose, 1000)
  }

  const handleExportImage = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        backgroundColor: '#1a1a1a',
        useCORS: true,
        pixelRatio: 2 // High res
      })
      
      const link = document.createElement('a')
      link.download = `fairrate_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to export image', err)
      alert('Failed to generate image. This might be due to browser security restrictions on the movie poster.')
    } finally {
      setIsExporting(false)
    }
  }

  const renderCard = (isExport = false) => {
    if (shareLayout === 'horizontal') {
      return (
        <div ref={isExport ? cardRef : null} className="w-[850px] min-h-[544px] h-auto bg-[#0a0a0a] flex p-8 gap-8 rounded-xl border border-[#333] shadow-2xl relative overflow-hidden shrink-0">
          {posterUrl && (
            <>
              <img src={posterUrl} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-[1.2] saturate-[2] z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20 z-0 pointer-events-none"></div>
            </>
          )}
          <div className="absolute top-0 right-0 w-80 h-80 bg-imdb-yellow/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2 z-0"></div>
          
          {posterUrl && (
            <img src={posterUrl} crossOrigin="anonymous" className="w-[320px] h-[480px] object-cover rounded-lg shadow-2xl border border-white/10 z-10 shrink-0 relative" />
          )}
          <div className="flex flex-col py-2 z-10 flex-1 min-w-0 relative">
            <h1 className={cn("font-black text-white leading-tight mb-2 line-clamp-2 break-words shrink-0", title.length > 35 ? "text-3xl" : "text-4xl")} title={title}>{title}</h1>
            <div className="flex flex-col mb-8 shrink-0">
              <span className="text-imdb-yellow/80 font-bold uppercase tracking-widest text-xs mb-1">My Rating</span>
              <div className="flex items-end gap-2 text-imdb-yellow">
                <span className="text-6xl font-black leading-none">{overallScore}</span>
                <span className="text-2xl font-bold text-gray-400 mb-1">/10</span>
              </div>
            </div>
            <div className={cn("grid gap-y-3 shrink-0", currentAspects.length > 5 ? "grid-cols-2 gap-x-12" : "grid-cols-1")}>
              {currentAspects.map(aspect => (
                <div key={aspect.id} className="flex items-center justify-between text-lg">
                  <span className="text-gray-400 capitalize">{aspect.label}</span>
                  <span className="text-white font-mono font-bold flex items-center gap-2">
                    {scores[aspect.id] || 5} <Star className="w-4 h-4 fill-imdb-yellow text-imdb-yellow" />
                  </span>
                </div>
              ))}
            </div>
            <div className="text-right border-t border-white/10 pt-4 mt-auto flex items-center justify-end gap-2 text-gray-500 font-bold tracking-widest uppercase text-sm shrink-0">
              <img src={chrome.runtime.getURL('icons/icon48.png')} className="w-5 h-5 opacity-80" alt="FairRate Logo" />
              Rated via FairRate
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div ref={isExport ? cardRef : null} className="w-[500px] min-h-[1150px] h-auto bg-[#0a0a0a] p-10 flex flex-col items-center rounded-xl border border-[#333] shadow-2xl relative overflow-hidden shrink-0">
          {posterUrl && (
            <>
              <img src={posterUrl} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-[1.2] saturate-[2] z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-[#0a0a0a] z-0 pointer-events-none"></div>
            </>
          )}
          <div className="absolute top-0 left-1/2 w-80 h-80 bg-imdb-yellow/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/4 z-0"></div>
          
          {posterUrl && (
            <img src={posterUrl} crossOrigin="anonymous" className="w-[240px] h-[360px] object-cover rounded-xl shadow-2xl border border-white/20 mb-8 z-10 shrink-0 relative" />
          )}
          <h1 className={cn("font-black text-white text-center leading-tight mb-6 z-10 line-clamp-2 break-words shrink-0 w-full relative", title.length > 35 ? "text-2xl" : "text-3xl")} title={title}>{title}</h1>
          <div className="flex flex-col items-center mb-8 bg-black/60 backdrop-blur-md px-10 py-4 rounded-3xl border border-white/10 shadow-inner z-10 shrink-0 relative">
            <span className="text-imdb-yellow/80 font-bold uppercase tracking-widest text-xs mb-2">My Rating</span>
            <div className="flex items-end gap-2 text-imdb-yellow">
              <span className="text-5xl font-black leading-none">{overallScore}</span>
              <span className="text-xl font-bold text-gray-400 mb-1">/10</span>
            </div>
          </div>
          <div className={cn("w-full mb-8 z-10 shrink-0 mt-auto relative", currentAspects.length > 6 ? "space-y-2.5" : "space-y-4")}>
            {currentAspects.map(aspect => (
              <div key={aspect.id} className={cn("flex items-center justify-between text-lg bg-black/60 backdrop-blur-md px-5 rounded-lg border border-white/5", currentAspects.length > 6 ? "py-1.5" : "py-2.5")}>
                <span className="text-gray-400 capitalize">{aspect.label}</span>
                <span className="text-white font-mono font-bold flex items-center gap-2">
                  {scores[aspect.id] || 5} <Star className="w-4 h-4 fill-imdb-yellow text-imdb-yellow" />
                </span>
              </div>
            ))}
          </div>
          <div className="w-full text-center border-t border-white/10 pt-6 flex justify-center items-center gap-2 text-gray-400 font-bold tracking-widest uppercase text-sm z-10 shrink-0 mt-auto relative">
            <img src={chrome.runtime.getURL('icons/icon48.png')} className="w-5 h-5 opacity-80" alt="FairRate Logo" />
            Rated via FairRate
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4" 
      style={{ fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}
      onClick={onClose}
    >
      {!shareMode && (
        <div 
          className="bg-imdb-dark text-white w-full max-w-[440px] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 border border-imdb-border flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-imdb-border bg-imdb-darker shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-bold truncate text-white tracking-wide">{title || "Current Movie"}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-imdb-border transition-colors text-gray-400 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-imdb-yellow/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* Weighted Score Panel */}
          <div className="flex items-center justify-between bg-gradient-to-r from-imdb-darker to-imdb-border/30 p-4 rounded-md border border-imdb-border shrink-0">
            <div>
              <span className="font-semibold text-lg block text-imdb-yellow">Weighted Score</span>
              <select 
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="mt-1 bg-imdb-darker border border-imdb-border text-xs text-gray-300 rounded px-2 py-1 focus:outline-none focus:border-imdb-yellow w-[180px]"
              >
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">{Number(overallScore)}</span>
              <span className="text-gray-400 font-medium text-lg">/10</span>
            </div>
          </div>

          <div className="space-y-6">
            {currentAspects.map((aspect) => (
              <div key={aspect.id} className="space-y-3">
                <div className="flex justify-between items-start text-sm">
                  <div className="pr-2">
                    <span className="font-medium text-[15px] block leading-tight text-gray-200">{aspect.label}</span>
                    <span className="text-[11px] text-gray-400 leading-tight mt-1 block">{aspect.desc}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {weights[aspect.id] !== 1 && (
                      <span className="text-[10px] bg-imdb-border px-1.5 py-0.5 rounded text-gray-300 font-mono" title="Genre Weight Modifier">
                        x{weights[aspect.id].toFixed(1)}
                      </span>
                    )}
                    <span className="text-imdb-yellow font-bold font-mono bg-imdb-darker border border-imdb-border px-2 py-0.5 rounded-sm">
                      {scores[aspect.id] || 5}
                    </span>
                  </div>
                </div>
                <StarRating 
                  value={scores[aspect.id] || 5} 
                  onChange={(val) => handleScoreChange(aspect.id, val)}
                />
              </div>
            ))}
          </div>

          {friendsRatings.length > 0 && (
            <div className="pt-6 border-t border-imdb-border space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Friends' Ratings</h3>
              <div className="space-y-3">
                {friendsRatings.map((fr, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-imdb-darker p-3 rounded-md border border-imdb-border/50">
                    <div className="flex items-center gap-3">
                      {fr.user.picture ? (
                        <img src={fr.user.picture} className="w-8 h-8 rounded-full border border-imdb-border" alt="Profile" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-imdb-border flex items-center justify-center text-white text-xs font-bold">{fr.user.name[0]}</div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">{fr.user.name}</div>
                        <div className="text-[10px] text-gray-400">Rated {new Date(fr.rating.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-imdb-yellow">
                      <span className="text-xl">{Number(fr.rating.overall)}</span>
                      <Star className="w-4 h-4 fill-imdb-yellow text-imdb-yellow -mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-imdb-border bg-imdb-darker flex justify-between items-center shrink-0">
            <button
              onClick={() => setShareMode(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold text-gray-400 hover:text-imdb-yellow transition-colors"
              title="Share Rating Card"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-sm text-sm font-semibold text-gray-300 hover:bg-imdb-border hover:text-white transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={cn(
                  "flex items-center gap-2 px-8 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-all",
                  isSaved 
                    ? "bg-green-600 text-white hover:bg-green-700" 
                    : "bg-imdb-yellow text-black hover:bg-[#d8ad15]",
                  isSaving && "opacity-80 cursor-not-allowed"
                )}
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Star className="w-4 h-4 fill-black text-black" />}
                {isSaving ? "Saving..." : isSaved ? "Saved!" : "Rate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareMode && (
        <div 
          className="bg-imdb-dark text-white w-full max-w-[900px] rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 border border-imdb-border flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-imdb-border bg-imdb-darker shrink-0">
            <button onClick={() => setShareMode(false)} className="flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-400">Layout:</span>
              <div className="flex bg-black rounded-lg p-1 border border-imdb-border">
                <button 
                  onClick={() => setShareLayout('horizontal')}
                  className={cn("p-1.5 rounded-md transition-colors", shareLayout === 'horizontal' ? "bg-imdb-border text-imdb-yellow" : "text-gray-500 hover:text-white")}
                  title="Horizontal Layout"
                >
                  <LayoutPanelLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShareLayout('vertical')}
                  className={cn("p-1.5 rounded-md transition-colors", shareLayout === 'vertical' ? "bg-imdb-border text-imdb-yellow" : "text-gray-500 hover:text-white")}
                  title="Vertical Layout"
                >
                  <LayoutPanelTop className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Body: Preview Area */}
          <div className="p-8 bg-[#111] overflow-auto flex items-center justify-center flex-1 min-h-0">
            {/* Wrapper perfectly sized to the scaled dimensions to prevent scroll clipping */}
            <div style={{ 
              width: shareLayout === 'horizontal' ? 850 * 0.85 : 500 * 0.65, 
              height: shareLayout === 'horizontal' ? 544 * 0.85 : 1150 * 0.65,
              position: 'relative'
            }}>
              <div 
                style={{ 
                  transform: `scale(${shareLayout === 'horizontal' ? 0.85 : 0.65})`, 
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              >
                {renderCard(false)}
              </div>
            </div>
          </div>

          {/* HIDDEN EXPORT CONTAINER: Rendered at 1x scale with NO transforms to guarantee perfect html-to-image capture */}
          <div className="fixed top-[-9999px] left-[-9999px]">
            {renderCard(true)}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-imdb-border bg-imdb-darker flex justify-end shrink-0">
            <button
              onClick={handleExportImage}
              disabled={isExporting}
              className="flex items-center gap-2 bg-imdb-yellow text-black px-8 py-2.5 rounded-sm font-bold uppercase tracking-wider hover:bg-[#d8ad15] transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Generating..." : "Download Card"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
