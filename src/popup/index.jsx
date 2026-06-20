import React, { useEffect, useState, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Download, Upload, Film, Star } from 'lucide-react'
import { getAllRatings, exportRatings, importRatings } from '../lib/storage'
import '../content/styles.css'

function Popup() {
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadRatings()
  }, [])

  async function loadRatings() {
    setLoading(true)
    const data = await getAllRatings()
    setRatings(data)
    setLoading(false)
  }

  async function handleExport() {
    const json = await exportRatings()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fairrate_backup_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      const success = await importRatings(event.target.result)
      if (success) {
        alert('Ratings imported successfully!')
        loadRatings()
      } else {
        alert('Failed to import ratings. Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="w-[400px] h-[500px] bg-imdb-dark text-white font-sans flex flex-col selection:bg-imdb-yellow selection:text-black">
      {/* Header */}
      <header className="p-4 border-b border-imdb-border bg-imdb-darker flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-wide">
          <img src="/icons/icon48.png" className="w-6 h-6" alt="FairRate" /> FairRate
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => chrome.runtime.openOptionsPage()} 
            className="text-xs font-bold bg-imdb-yellow text-black px-3 py-1.5 rounded-md hover:bg-[#d8ad15] transition-colors uppercase tracking-wider"
          >
            Dashboard
          </button>
          <button onClick={handleExport} className="p-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors" title="Export to JSON">
            <Download className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
          <button onClick={() => fileInputRef.current.click()} className="p-2 bg-white/5 hover:bg-white/10 rounded-md transition-colors" title="Import JSON">
            <Upload className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
        {loading ? (
          <p className="text-center text-gray-500 text-sm py-8">Loading ratings...</p>
        ) : ratings.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Film className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-gray-400 text-sm">You haven't rated any movies yet.</p>
            <p className="text-xs text-gray-500">Go to IMDb and rate a movie to see it here!</p>
          </div>
        ) : (
          ratings.map(r => (
            <div key={r.movieId} className="p-4 rounded-xl border border-imdb-border bg-imdb-darker shadow-sm space-y-3 hover:border-imdb-yellow/30 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <a href={`https://www.imdb.com/title/${r.movieId}/`} target="_blank" rel="noreferrer" className="font-bold text-gray-100 hover:text-imdb-yellow transition-colors flex-1 line-clamp-2">
                  {r.title}
                </a>
                <div className="flex flex-col items-end">
                  <div className="text-2xl font-black text-imdb-yellow leading-none">{r.overall}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-1">Overall</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-white/5">
                {Object.entries(r.scores).map(([aspect, score]) => (
                  <div key={aspect} className="flex justify-between items-center bg-[#222] px-2 py-1.5 rounded border border-white/5">
                    <span className="capitalize text-gray-400 font-medium">{aspect}</span>
                    <span className="font-bold text-gray-200 flex items-center gap-1">
                      {score} <Star className="w-3 h-3 fill-imdb-yellow text-imdb-yellow" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<Popup />)
