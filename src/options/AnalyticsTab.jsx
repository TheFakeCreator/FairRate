import React, { useMemo, useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar } from 'recharts';
import { ActivityCalendar } from 'react-activity-calendar';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';
import { TrendingUp, Film, Star, Award, BarChart2, CalendarDays } from 'lucide-react';
import { getPresets } from '../lib/storage';

const DEFAULT_ASPECTS_META = {
  enjoyment: { label: 'Enjoyment & Pacing' },
  story: { label: 'Story & Plot' },
  characters: { label: 'Characters & Acting' },
  technical: { label: 'Technical Execution' },
  emotional: { label: 'Emotional Impact' },
};

export default function AnalyticsTab({ ratings }) {
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [globalPresets, setGlobalPresets] = useState([]);

  useEffect(() => {
    async function loadPresets() {
      const p = await getPresets();
      setGlobalPresets(p);
    }
    loadPresets();
  }, []);

    const stats = useMemo(() => {
    if (!ratings || ratings.length === 0) {
      return { total: 0, average: 0, distribution: [], activity: [], presets: [], daysData: [], hallOfFame: [], avgBias: null };
    }

    const total = ratings.length;
    const average = (ratings.reduce((acc, r) => acc + (Number(r.overall) || 0), 0) / total).toFixed(1);

    // Critic Tendency (Bias)
    let totalBias = 0;
    let biasCount = 0;
    ratings.forEach(r => {
      if (r.publicIMDbRating && !isNaN(r.publicIMDbRating) && r.overall) {
        totalBias += (Number(r.overall) - Number(r.publicIMDbRating));
        biasCount++;
      }
    });
    const avgBias = biasCount > 0 ? (totalBias / biasCount).toFixed(2) : null;

    // Hall of Fame
    const hallOfFame = [...ratings]
      .filter(r => r.overall !== undefined)
      .sort((a, b) => b.overall - a.overall || new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10);

    // Day of Week Activity
    const daysArr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysData = daysArr.map(day => ({ day, count: 0 }));
    ratings.forEach(r => {
      const d = r.updatedAt ? new Date(r.updatedAt) : new Date();
      if (!isNaN(d.getTime())) {
        daysData[d.getDay()].count += 1;
      }
    });

    // Rating Distribution
    const distCounts = { 10: 0, 9: 0, 8: 0, 7: 0, 6: 0, 5: 0 };
    ratings.forEach(r => {
      if (r.overall !== undefined) {
        const s = Number(r.overall);
        if (s >= 9.5) distCounts[10]++;
        else if (s >= 8.5) distCounts[9]++;
        else if (s >= 7.5) distCounts[8]++;
        else if (s >= 6.5) distCounts[7]++;
        else if (s >= 5.5) distCounts[6]++;
        else if (s > 0) distCounts[5]++;
      }
    });
    
    let maxDistCount = 0;
    const distribution = [10, 9, 8, 7, 6, 5].map(bucket => {
      const count = distCounts[bucket];
      if (count > maxDistCount) maxDistCount = count;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        label: bucket === 5 ? '5↓' : bucket.toString(),
        isStar: bucket !== 5,
        count,
        pct
      };
    });
    const distMax = maxDistCount;

    // Scatter Data
    const scatterData = ratings
      .filter(r => r.overall !== undefined && r.overall !== null)
      .map((r, i) => {
        let time = new Date().getTime() - i * 86400000;
        if (r.updatedAt) {
          const parsed = new Date(r.updatedAt).getTime();
          if (!isNaN(parsed)) time = parsed;
        }
        return {
          title: r.title,
          time: time,
          score: Number(r.overall) || 0
        };
      })
      .sort((a, b) => a.time - b.time);

    // Activity Calendar
    const activityMap = {};
    ratings.forEach(r => {
      const dateStr = r.updatedAt ? r.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    const activity = [];
    const today = new Date();
    for (let i = 365; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityMap[dateStr] || 0;
      activity.push({
        date: dateStr,
        count: count,
        level: count === 0 ? 0 : Math.min(4, Math.ceil(count / 2))
      });
    }

    // Presets & Taste Profile
    const presetsMap = {};
    ratings.forEach(r => {
      // Fallback for older ratings without preset
      const pId = r.presetId || 'default';
      const pName = r.presetName || 'Movies';
      if (!presetsMap[pId]) {
        presetsMap[pId] = { name: pName, id: pId, aspects: {}, count: 0 };
      }
      presetsMap[pId].count += 1;
      if (r.scores) {
        Object.entries(r.scores).forEach(([aspectId, score]) => {
          let aspectName = aspectId;
          
          // 1. Try to get it from globalPresets (Custom Aspects)
          const globalPreset = globalPresets.find(p => p.id === pId);
          
          // Skip if this aspect was removed from the preset configuration
          if (globalPreset && !globalPreset.weights[aspectId]) {
            return;
          }

          if (globalPreset && globalPreset.aspectMeta && globalPreset.aspectMeta[aspectId]) {
            aspectName = globalPreset.aspectMeta[aspectId].label;
          } 

          // 2. Fallback to default meta (Built-in Aspects)
          else if (DEFAULT_ASPECTS_META[aspectId]) {
            aspectName = DEFAULT_ASPECTS_META[aspectId].label;
          }
          // 3. Fallback to raw ID or r.weights
          else if (r.weights && r.weights[aspectId] && r.weights[aspectId].name) {
            aspectName = r.weights[aspectId].name;
          }

          if (!presetsMap[pId].aspects[aspectName]) presetsMap[pId].aspects[aspectName] = { total: 0, count: 0 };
          presetsMap[pId].aspects[aspectName].total += Number(score);
          presetsMap[pId].aspects[aspectName].count += 1;
        });
      }
    });
    
    const presets = Object.values(presetsMap).map(p => {
      const radarData = Object.keys(p.aspects).map(aspect => {
        // Capitalize the first letter of each word to fix lowercase user inputs
        const prettyAspect = aspect.replace(/\b\w/g, c => c.toUpperCase());
        return {
          subject: prettyAspect,
          A: Number((p.aspects[aspect].total / p.aspects[aspect].count).toFixed(1)),
          fullMark: 10
        };
      });
      return { ...p, radarData };
    });

    return { total, average, scatter: scatterData, activity, presets, daysData, hallOfFame, avgBias, distribution, distMax };
  }, [ratings, globalPresets]);

  useEffect(() => {
    if (stats.presets.length > 0 && !selectedPresetId) {
      setSelectedPresetId(stats.presets[0].id);
    }
  }, [stats.presets, selectedPresetId]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const dateStr = new Date(data.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      return (
        <div className="bg-imdb-darker border border-imdb-border p-3 rounded-lg shadow-xl text-white">
          <p className="font-bold text-imdb-yellow mb-1 text-base">{data.title}</p>
          <p className="text-sm text-gray-300">Score: <span className="font-bold text-white">{data.score}</span></p>
          <p className="text-xs text-gray-500 mt-1">{dateStr}</p>
        </div>
      );
    }
    return null;
  };

  const getBiasLabel = (bias) => {
    if (bias === null) return { label: "Not Enough Data", color: "text-gray-500", desc: "Rate more movies to see alignment." };
    const num = Number(bias);
    if (num > 0.5) return { label: "Generous Rater", color: "text-green-400", desc: `You rate ${bias} points higher than IMDb avg.` };
    if (num < -0.5) return { label: "Tough Critic", color: "text-red-400", desc: `You rate ${Math.abs(num)} points lower than IMDb avg.` };
    return { label: "Balanced Reviewer", color: "text-blue-400", desc: `You align closely with the IMDb avg.` };
  };

  const biasInfo = getBiasLabel(stats.avgBias);
  const selectedPreset = stats.presets.find(p => p.id === selectedPresetId) || stats.presets[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-imdb-yellow" />
          Your Insights
        </h2>
      </div>

      {ratings.length === 0 ? (
        <div className="text-center py-20 bg-imdb-dark rounded-xl border border-imdb-border">
          <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300">No data available</h3>
          <p className="text-gray-500 mt-2">Rate some movies to see your analytics!</p>
        </div>
      ) : (
        <>
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-6 flex items-center gap-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-imdb-yellow/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="w-16 h-16 rounded-full bg-imdb-darker border border-imdb-border flex items-center justify-center shrink-0 z-10">
                <Film className="w-8 h-8 text-imdb-yellow" />
              </div>
              <div className="z-10">
                <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">Total Rated</p>
                <p className="text-4xl font-black text-white">{stats.total}</p>
              </div>
            </div>
            
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-6 flex items-center gap-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-imdb-yellow/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="w-16 h-16 rounded-full bg-imdb-darker border border-imdb-border flex items-center justify-center shrink-0 z-10">
                <Star className="w-8 h-8 text-imdb-yellow" />
              </div>
              <div className="z-10">
                <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">Average Score</p>
                <div className="flex items-end gap-1">
                  <p className="text-4xl font-black text-white">{stats.average}</p>
                  <p className="text-xl font-bold text-gray-500 mb-1">/10</p>
                </div>
              </div>
            </div>

            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-6 flex items-center gap-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-imdb-yellow/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="w-16 h-16 rounded-full bg-imdb-darker border border-imdb-border flex items-center justify-center shrink-0 z-10">
                <Award className={`w-8 h-8 ${biasInfo.color}`} />
              </div>
              <div className="z-10">
                <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">Audience Alignment</p>
                <p className={`text-xl font-black ${biasInfo.color}`}>{biasInfo.label}</p>
                <p className="text-xs text-gray-500 mt-1">{biasInfo.desc}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Taste Profile */}
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-imdb-yellow" />
                  Taste Profile
                </h3>
                {stats.presets.length > 1 && (
                  <select 
                    value={selectedPresetId || ''} 
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="bg-imdb-darker border border-imdb-border text-white text-sm rounded-lg focus:ring-imdb-yellow focus:border-imdb-yellow block p-2"
                  >
                    {stats.presets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.count})</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex-1 min-h-[300px]">
                {selectedPreset && selectedPreset.radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedPreset.radarData}>
                      <PolarGrid stroke="#444" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#ccc', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#666' }} />
                      <Radar name="Average Score" dataKey="A" stroke="#f5c518" fill="#f5c518" fillOpacity={0.4} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#222', borderColor: '#444', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#f5c518', fontWeight: 'bold' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">No aspect data for this preset.</div>
                )}
              </div>
            </div>

            {/* Day of Week */}
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg flex flex-col">
              <h3 className="text-xl font-bold mb-6 text-gray-200 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-imdb-yellow" />
                Activity by Day
              </h3>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.daysData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: '#aaa', fontWeight: 'bold' }} 
                      axisLine={{ stroke: '#444' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#666' }} 
                      axisLine={{ stroke: '#444' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#ffffff0a' }} 
                      contentStyle={{ backgroundColor: '#222', borderColor: '#444', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#aaa' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value) => [`${value} ratings`, 'Activity']}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stats.daysData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#f5c518' : '#333'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-6 text-gray-200">Rating Activity</h3>
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[800px] flex justify-center">
                <ActivityCalendar 
                  data={stats.activity} 
                  theme={{
                    light: ['#404040', '#d8ad1533', '#d8ad1566', '#d8ad1599', '#f5c518'],
                    dark: ['#404040', '#d8ad1533', '#d8ad1566', '#d8ad1599', '#f5c518']
                  }}
                  colorScheme="dark"
                  labels={{
                    totalCount: '{{count}} ratings in the last year',
                  }}
                  hideTotalCount={false}
                  showWeekdayLabels
                  renderBlock={(block, activity) => (
                    React.cloneElement(block, {
                      'data-tooltip-id': 'heatmap-tooltip',
                      'data-tooltip-content': `${activity.count} ratings on ${new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
                      'title': `${activity.count} ratings on ${new Date(activity.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`,
                    })
                  )}
                />
                <ReactTooltip 
                  id="heatmap-tooltip" 
                  style={{ backgroundColor: '#222', color: '#fff', borderRadius: '8px', zIndex: 9999 }} 
                />
              </div>
            </div>
          </div>

          {/* Distribution & Timeline */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Rating Distribution */}
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg flex flex-col xl:col-span-1">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-200 mb-1">Rating Distribution</h3>
                <p className="text-xs text-gray-400">Shows if you are a harsh or generous reviewer.</p>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-3">
                {stats.distribution.map((d, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm font-medium">
                    <div className="w-12 text-right text-gray-300 flex items-center justify-end gap-1 shrink-0">
                      {d.label} {d.isStar ? <Star className="w-3 h-3 fill-current" /> : ''}
                    </div>
                    <div className="flex-1 h-5 bg-imdb-darker rounded-sm overflow-hidden flex">
                      <div 
                        className="h-full bg-imdb-yellow transition-all duration-1000" 
                        style={{ width: `${stats.distMax > 0 ? (d.count / stats.distMax) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="w-10 text-gray-400 shrink-0">
                      {d.pct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scatter Plot Chart */}
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg xl:col-span-2">
              <h3 className="text-xl font-bold mb-6 text-gray-200">Rating Timeline</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                    <XAxis 
                      dataKey="time" 
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString(undefined, { month: 'short' })}
                      tick={{ fill: '#666', fontSize: 12, fontWeight: 'bold' }} 
                      axisLine={{ stroke: '#333' }}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      dataKey="score" 
                      domain={[0, 10]} 
                      tick={{ fill: '#666', fontSize: 12 }} 
                      axisLine={{ stroke: '#333' }}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#333' }} content={<CustomTooltip />} />
                    <Scatter data={stats.scatter} fill="#f5c518" line={{ stroke: '#f5c518', strokeWidth: 2, opacity: 0.5 }} shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Hall of Fame */}
          {stats.hallOfFame.length > 0 && (
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg">
              <h3 className="text-xl font-bold mb-6 text-gray-200 flex items-center gap-2">
                <Award className="w-6 h-6 text-imdb-yellow" />
                Hall of Fame (Top 10)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {stats.hallOfFame.map((movie, idx) => (
                  <a key={idx} href={`https://www.imdb.com/title/${movie.movieId}/`} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg border border-imdb-border/50 hover:border-imdb-yellow transition-colors">
                    {movie.posterUrl ? (
                      <img src={movie.posterUrl} alt={movie.title} className="w-full h-auto aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-imdb-darker flex items-center justify-center p-4 text-center">
                        <Film className="w-10 h-10 text-gray-600 mb-2" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <p className="text-white font-bold text-sm line-clamp-2 leading-tight">{movie.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-imdb-yellow fill-imdb-yellow" />
                        <span className="text-imdb-yellow font-bold text-xs">{movie.overall}</span>
                      </div>
                    </div>
                    {/* Rank Badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 bg-imdb-yellow text-black rounded-full flex items-center justify-center font-bold text-xs shadow-lg">
                      #{idx + 1}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
