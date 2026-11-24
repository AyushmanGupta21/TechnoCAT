"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DailyStudy } from '@/lib/metrics/types';

interface StudyPerformanceChartProps {
  /** Recorded study per day (metrics.studyTime.daily), oldest first — usually the last 7 days. */
  daily: DailyStudy[];
}

type Unit = 'min' | 'h';

// Data palette (globals.css --data-blue / --data-teal); validated as an adjacent pair.
const LEARNING = '#3b82f6';
const PRACTICE = '#14b8a6';
const INK = '#0c1730';
const INK_3 = '#66708a';
const LINE = '#e4e9f2';

/** Weekday label for a YYYY-MM-DD date (parsed at UTC noon so the day never shifts). */
function weekdayLabel(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(255,255,255,0.96)',
          padding: '10px 12px',
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          boxShadow: '0 2px 4px rgba(12,23,48,0.04), 0 18px 40px -12px rgba(23,47,110,0.18)',
          fontFamily: 'var(--ff-sans)',
          minWidth: 140,
        }}
      >
        <p style={{ margin: '0 0 6px 0', fontWeight: 600, fontSize: 12.5, color: INK }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ margin: '0 0 3px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12.5, color: INK_3 }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color }} />
              {entry.name}
            </span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 600, color: INK }}>
              {entry.value}
              {unit === 'h' ? 'h' : ' min'}
            </span>
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

  const tick = { fill: INK_3, fontSize: 11.5, fontFamily: 'var(--ff-mono)' };

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLearning" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={LEARNING} stopOpacity={0.22} />
              <stop offset="95%" stopColor={LEARNING} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorChallenge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={PRACTICE} stopOpacity={0.22} />
              <stop offset="95%" stopColor={PRACTICE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 4" vertical={false} stroke={LINE} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={tick} dy={8} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={tick}
            allowDecimals={unit === 'h'}
            tickFormatter={(val) => `${val}${unit === 'h' ? 'h' : 'm'}`}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#bfd3ff', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="learning"
            name="Learning"
            stroke={LEARNING}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLearning)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="practice"
            name="Practice"
            stroke={PRACTICE}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorChallenge)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
