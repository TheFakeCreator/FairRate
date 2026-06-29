import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';
import { ActivityCalendar } from 'react-activity-calendar';
import { TrendingUp, Film, Star } from 'lucide-react';

export default function AnalyticsTab({ ratings }) {
  const stats = useMemo(() => {
    if (!ratings || ratings.length === 0) {
      return { total: 0, average: 0, distribution: [], activity: [] };
    }

    const total = ratings.length;
    const average = (ratings.reduce((acc, r) => acc + Number(r.overall), 0) / total).toFixed(1);

    // Scatter Data
    const scatterData = ratings
      .filter(r => r.overall !== undefined)
      .map((r, i) => {
        const time = r.updatedAt ? new Date(r.updatedAt).getTime() : new Date().getTime() - i * 86400000;
        return {
          title: r.title,
          time: time,
          score: Number(r.overall)
        };
      })
      .sort((a, b) => a.time - b.time); // sort chronologically

    return { total, average, scatter: scatterData, activity };
  }, [ratings]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-6 flex items-center gap-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-imdb-yellow/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="w-16 h-16 rounded-full bg-imdb-darker border border-imdb-border flex items-center justify-center shrink-0">
                <Film className="w-8 h-8 text-imdb-yellow" />
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">Total Rated</p>
                <p className="text-5xl font-black text-white">{stats.total}</p>
              </div>
            </div>
            
            <div className="bg-imdb-dark border border-imdb-border rounded-xl p-6 flex items-center gap-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-imdb-yellow/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="w-16 h-16 rounded-full bg-imdb-darker border border-imdb-border flex items-center justify-center shrink-0">
                <Star className="w-8 h-8 text-imdb-yellow" />
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-sm mb-1">Average Score</p>
                <div className="flex items-end gap-1">
                  <p className="text-5xl font-black text-white">{stats.average}</p>
                  <p className="text-xl font-bold text-gray-500 mb-1">/10</p>
                </div>
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
                />
              </div>
            </div>
          </div>

          {/* Scatter Plot Chart */}
          <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-6 text-gray-200">Rating Timeline</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                  <XAxis 
                    dataKey="time" 
                    type="number"
                    domain={['dataMin - 86400000', 'dataMax + 86400000']}
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
                  <Scatter data={stats.scatter} fill="#f5c518" line={false} shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
