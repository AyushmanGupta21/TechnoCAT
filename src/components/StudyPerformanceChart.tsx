"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyStudy } from '@/lib/metrics/types';

interface StudyPerformanceChartProps {
  /** Recorded study per day (metrics.studyTime.daily), oldest first — usually the last 7 days. */
  daily: DailyStudy[];
}

type Unit = 'min' | 'h';

/** Weekday label for a YYYY-MM-DD date (parsed at UTC noon so the day never shifts). */
function weekdayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#111827' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: '0 0 4px 0', color: entry.color, fontSize: '13px' }}>
            {entry.name}: <span style={{ fontWeight: 600 }}>{entry.value}{unit === 'h' ? 'h' : ' min'}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function StudyPerformanceChart({ daily }: StudyPerformanceChartProps) {
  // Minutes for light weeks, hours once any day reaches 90 minutes.
  const maxDaySeconds = daily.reduce((m, d) => Math.max(m, d.learningSeconds + d.practiceSeconds), 0);
  const unit: Unit = maxDaySeconds >= 90 * 60 ? 'h' : 'min';
  const convert = (seconds: number) =>
    unit === 'h' ? Math.round((seconds / 3600) * 10) / 10 : Math.round(seconds / 60);

  const data = daily.map((d) => ({
    day: weekdayLabel(d.date),
    learning: convert(d.learningSeconds),
    practice: convert(d.practiceSeconds),
  }));

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorLearning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorChallenge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            allowDecimals={unit === 'h'}
            tickFormatter={(val) => `${val}${unit === 'h' ? 'h' : 'm'}`}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Area
            type="monotone"
            dataKey="learning"
            name="Learning"
            stroke="#2563EB"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorLearning)"
          />
          <Area
            type="monotone"
            dataKey="practice"
            name="Practice"
            stroke="#8B5CF6"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorChallenge)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
