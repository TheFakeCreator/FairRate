import React, { useState } from 'react'
import { searchUser, toggleFollow, getFollowing } from '../../lib/storage'

export default function SocialTab({ user, following, setFollowing }) {
  const [friendSearchEmail, setFriendSearchEmail] = useState('')
  const [friendSearchResult, setFriendSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
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
  )
}
