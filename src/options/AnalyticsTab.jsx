import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ActivityCalendar } from 'react-activity-calendar';
import { TrendingUp, Film, Star } from 'lucide-react';

export default function AnalyticsTab({ ratings }) {
  const stats = useMemo(() => {
    if (!ratings || ratings.length === 0) {
      return { total: 0, average: 0, distribution: [], activity: [] };
    }

    const total = ratings.length;
    const average = (ratings.reduce((acc, r) => acc + Number(r.overall), 0) / total).toFixed(1);

    // Distribution (0-10)
    const distMap = Array.from({ length: 11 }, (_, i) => ({ score: i, count: 0 }));
    ratings.forEach(r => {
      const rounded = Math.round(Number(r.overall));
      if (rounded >= 0 && rounded <= 10) {
        distMap[rounded].count += 1;
      }
    });

    // Activity Calendar
    const activityMap = {};
    ratings.forEach(r => {
      // Assuming updatedAt is ISO string. If missing, fallback to today.
      const dateStr = r.updatedAt ? r.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    const activity = Object.keys(activityMap).map(date => ({
      date,
      count: activityMap[date],
      level: Math.min(4, Math.ceil(activityMap[date] / 2)) // simple scaling
    }));

    // react-activity-calendar requires at least one data point to render properly usually
    if (activity.length === 0) {
      activity.push({ date: new Date().toISOString().split('T')[0], count: 0, level: 0 });
    }

    return { total, average, distribution: distMap, activity };
  }, [ratings]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-imdb-darker border border-imdb-border p-3 rounded-lg shadow-xl text-white">
          <p className="font-bold text-imdb-yellow mb-1">Score: {payload[0].payload.score}</p>
          <p className="text-sm text-gray-300">{payload[0].value} movies</p>
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
                    light: ['#333333', '#d8ad1533', '#d8ad1566', '#d8ad1599', '#f5c518'],
                    dark: ['#333333', '#d8ad1533', '#d8ad1566', '#d8ad1599', '#f5c518']
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

          {/* Distribution Chart */}
          <div className="bg-imdb-dark border border-imdb-border rounded-xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-6 text-gray-200">Score Distribution</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.distribution} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="score" 
                    tick={{ fill: '#666', fontWeight: 'bold' }} 
                    axisLine={{ stroke: '#333' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }} 
                    axisLine={{ stroke: '#333' }}
                    tickLine={false}
                  />
                  <Tooltip cursor={{ fill: '#ffffff0a' }} content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#f5c518' : '#333'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
