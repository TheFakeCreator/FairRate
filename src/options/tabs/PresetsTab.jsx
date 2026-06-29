import React, { useState } from 'react'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import { savePresets } from '../../lib/storage'

export default function PresetsTab({ presets, setPresets, DEFAULT_ASPECTS_META }) {
  const [editingAspect, setEditingAspect] = useState(null)

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

  return (
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
                let displayLabel = aspect;
                if (meta) {
                  displayLabel = meta.label;
                } else if (DEFAULT_ASPECTS_META[aspect]) {
                  displayLabel = DEFAULT_ASPECTS_META[aspect].label;
                }
                
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
                className="w-full bg-imdb-yellow text-black font-bold py-2 rounded-md hover:bg-[#d8ad15] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
