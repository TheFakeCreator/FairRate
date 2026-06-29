import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { AlertCircle } from 'lucide-react'
import { getAllRatings, getPresets, getFollowing } from '../lib/storage'
import { signInWithGoogle, signOut, getUser } from '../lib/auth'
import { pullFromCloud, pushToCloud } from '../lib/storage'
import AnalyticsTab from './AnalyticsTab'
import Sidebar from './components/Sidebar'
import DashboardTab from './tabs/DashboardTab'
import PresetsTab from './tabs/PresetsTab'
import SocialTab from './tabs/SocialTab'
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
  
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [latestVersion, setLatestVersion] = useState('')

  useEffect(() => {
    // Check for updates
    async function checkForUpdates() {
      try {
        const response = await fetch('https://api.github.com/repos/TheFakeCreator/FairRate/releases/latest')
        if (response.ok) {
          const data = await response.json()
          const latest = data.tag_name.replace('v', '')
          const current = chrome.runtime.getManifest().version
          
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
      await pullFromCloud()
      await pushToCloud()
      
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

  return (
    <div className="flex h-screen bg-imdb-dark text-white font-sans selection:bg-imdb-yellow selection:text-black">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        handleSignIn={handleSignIn} 
        handleSignOut={handleSignOut} 
        handleForceSync={handleForceSync} 
      />

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
          <DashboardTab 
            ratings={ratings} 
            setRatings={setRatings} 
            presets={presets} 
            DEFAULT_ASPECTS_META={DEFAULT_ASPECTS_META} 
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab ratings={ratings} />
        ) : activeTab === 'presets' ? (
          <PresetsTab 
            presets={presets} 
            setPresets={setPresets} 
            DEFAULT_ASPECTS_META={DEFAULT_ASPECTS_META} 
          />
        ) : activeTab === 'friends' ? (
          <SocialTab 
            user={user} 
            following={following} 
            setFollowing={setFollowing} 
          />
        ) : null}
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root'))
root.render(<OptionsPage />)
