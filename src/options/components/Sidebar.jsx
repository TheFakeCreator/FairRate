import React from 'react'
import { LayoutDashboard, Sliders, Users, TrendingUp, RefreshCw } from 'lucide-react'

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  handleSignIn,
  handleSignOut,
  handleForceSync
}) {
  return (
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
  )
}
