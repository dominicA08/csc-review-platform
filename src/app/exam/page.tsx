'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  getModuleLabel,
  getProgressCategory,
  getQuestionCategoryFilters,
  mapCategoryToDbString,
} from '@/lib/examModules'
import { supabase } from '@/utils/supabase'
import { ThemeToggleButton } from '../components/ThemeProvider'

// ── Types ──────────────────────────────────────────────────────────────────────
interface ChartDataPoint {
  label: string
  value: number
}

interface Question {
  id: string
  category: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  explanation: string
  chart_type: string | null
  chart_data: ChartDataPoint[] | string | null
  topic_group?: string
}

type PieSlice<T extends { value: number }> = {
  d: T
  i: number
  dash: number
  gap: number
  dashOffset: number
}

function buildPieSlices<T extends { value: number }>(
  data: T[],
  total: number,
  circumference: number,
): PieSlice<T>[] {
  return data.reduce<{ slices: PieSlice<T>[]; offset: number }>(
    (acc, d, i) => {
      const dash = (d.value / total) * circumference
      const gap = circumference - dash
      acc.slices.push({
        d,
        i,
        dash,
        gap,
        dashOffset: -acc.offset,
      })
      acc.offset += dash
      return acc
    },
    { slices: [], offset: 0 },
  ).slices
}

function parseChartData(raw: ChartDataPoint[] | string | null): ChartDataPoint[] | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ChartDataPoint[]
    } catch {
      return null
    }
  }
  return raw
}

function normalizeQuestion(row: Question): Question {
  return {
    ...row,
    chart_data: parseChartData(row.chart_data),
  }
}

// ── Utility: Fisher-Yates Shuffle ──────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Utility: Resolve Category Filters (Fixes Blank Slate) ──────────────────────
function getCategoryFilters(param: string | null): string[] {
  return getQuestionCategoryFilters(param)
}

// ── Utility: Map DB Chart Type to Visualizer Canvas Type ──────────────────────
function getChartVisualizerType(type: string | null): 'bar' | 'pie' | 'line' | 'table' | null {
  if (!type) return null
  const t = type.toLowerCase()
  if (t.includes('bar')) return 'bar'
  if (t.includes('pie')) return 'pie'
  if (t.includes('line')) return 'line'
  if (t.includes('table')) return 'table'
  if (t === 'bar' || t === 'pie' || t === 'line' || t === 'table') return t
  return null
}

// ── Utility: Shuffle Clusters for Full Exam Mode ──────────────────────────────
function groupAndShuffleQuestions(questions: Question[]): Question[] {
  const groups: Record<string, Question[]> = {}
  
  questions.forEach((q) => {
    const topicGroup = q.topic_group || q.chart_type || 'text_only'
    const key = `${q.category}_${topicGroup}`
    
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(q)
  })
  
  const groupKeys = Object.keys(groups)
  groupKeys.forEach((key) => {
    groups[key] = shuffleArray(groups[key])
  })
  
  const shuffledKeys = shuffleArray(groupKeys)
  
  const flattened: Question[] = []
  shuffledKeys.forEach((key) => {
    flattened.push(...groups[key])
  })
  
  return flattened
}

// ── Custom Visualizer Components for CSC Exam ───────────────────────────────

function ChartScroll({
  children,
  minWidth = 480,
}: {
  children: React.ReactNode
  minWidth?: number
}) {
  return (
    <div className="chart-scroll w-full">
      <div className="chart-scroll-inner" style={{ minWidth }}>
        {children}
      </div>
    </div>
  )
}

const Y_AXIS_TICKS_36K = [0, 6, 12, 18, 24, 30, 36] as const

function ChartYAxis({
  ticks,
  formatTick,
  plotClassName = 'h-64 sm:h-72',
}: {
  ticks: readonly number[]
  formatTick: (tick: number) => string
  plotClassName?: string
}) {
  const max = ticks[ticks.length - 1] || 1
  return (
    <div
      className={`relative shrink-0 w-11 sm:w-12 ${plotClassName} pt-8 pb-4`}
      aria-hidden
    >
      {ticks.map((tick) => (
        <span
          key={tick}
          className="absolute left-0 right-0 pr-1 text-right text-[11px] sm:text-xs font-mono font-black text-slate-600 dark:text-slate-300 tabular-nums leading-none"
          style={{
            bottom: `${(tick / max) * 100}%`,
            transform: 'translateY(50%)',
          }}
        >
          {formatTick(tick)}
        </span>
      ))}
    </div>
  )
}

function GroupedBarChart({ animate }: { animate: boolean }) {
  // Sourced directly from CSC exam data
  const data = [
    { label: 'Consultancy', bonds: 21, stocks: 3 },
    { label: 'Audit', bonds: 36, stocks: 6 },
    { label: 'IT', bonds: 24, stocks: 3 },
    { label: 'Insurance', bonds: 33, stocks: 3 },
    { label: 'PR', bonds: 24, stocks: 3 },
    { label: 'Auto', bonds: 24, stocks: 12 },
    { label: 'Sports', bonds: 27, stocks: 6 }
  ]
  const max = 36 // values in thousands
  const plotClassName = 'h-64 sm:h-72'
  
  return (
    <div className="w-full text-slate-800 dark:text-slate-100">
      <div className="text-center font-black text-xs sm:text-sm tracking-[0.25em] mb-5 text-cyan-600 dark:text-cyan-400 uppercase">
        Distribution of Securities (000s)
      </div>

      <ChartScroll minWidth={560}>
      <div className={`flex w-full chart-panel pr-4 pt-2 ${plotClassName}`}>
        <ChartYAxis ticks={Y_AXIS_TICKS_36K} formatTick={(tick) => `${tick}k`} plotClassName={plotClassName} />

        <div className={`relative flex-1 min-w-0 ${plotClassName} pt-8 pb-4 flex items-end justify-between gap-0.5`}>
        {/* Y Axis Grid Lines */}
        {Y_AXIS_TICKS_36K.map((tick) => (
          <div key={tick} className="absolute left-0 right-0 pointer-events-none" style={{ bottom: `${(tick / max) * 100}%`, height: 0 }}>
            <div className="absolute left-0 right-0 border-t border-slate-800/40 dark:border-slate-800/60" />
          </div>
        ))}
        
        {/* Solid Y Axis Line */}
        <div className="absolute left-0 top-6 bottom-4 border-l-2 border-slate-400 dark:border-slate-600" />
        
        {/* Grouped Bars */}
        {data.map((d, i) => {
          const bondsPct = (d.bonds / max) * 100
          const stocksPct = (d.stocks / max) * 100
          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-13 group z-10 h-full justify-end relative">
              <div className="flex items-end gap-1.5 h-48 justify-center w-full relative mb-1">
                {/* Bonds Bar */}
                <div
                  className="w-3.5 sm:w-5 bg-linear-to-t from-cyan-600 via-cyan-500 to-cyan-400 rounded-t-[3px] transition-all duration-1000 ease-out relative hover:from-cyan-400 hover:to-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.25)] hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] cursor-pointer group-hover:scale-105"
                  style={{ height: animate ? `${bondsPct}%` : '0%' }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black text-cyan-300 bg-slate-950/90 border border-cyan-500/30 px-1 py-0.5 rounded-sm shadow-md transition-opacity duration-200">
                    {d.bonds}
                  </span>
                </div>
                {/* Stocks Bar */}
                <div
                  className="w-3.5 sm:w-5 bg-linear-to-t from-amber-600 via-amber-500 to-amber-400 rounded-t-[3px] transition-all duration-1000 ease-out relative hover:from-amber-400 hover:to-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.25)] hover:shadow-[0_0_15px_rgba(245,158,11,0.6)] cursor-pointer group-hover:scale-105"
                  style={{ height: animate ? `${stocksPct}%` : '0%' }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-black text-amber-300 bg-slate-950/90 border border-amber-500/30 px-1 py-0.5 rounded-sm shadow-md transition-opacity duration-200">
                    {d.stocks}
                  </span>
                </div>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-extrabold mt-1.5 tracking-tight group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors text-center leading-tight px-0.5">
                {d.label}
              </span>
            </div>
          );
        })}
        </div>
      </div>
      </ChartScroll>
      
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mt-4 text-xs font-bold">
        <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 px-3 py-1.5 rounded-lg">
          <span className="w-3 h-3 bg-cyan-500 dark:bg-cyan-400 rounded-[3px] shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px]">Bonds</span>
        </div>
        <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 px-3 py-1.5 rounded-lg">
          <span className="w-3 h-3 bg-amber-500 dark:bg-amber-400 rounded-[3px] shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10.5px]">Stocks</span>
        </div>
      </div>
    </div>
  )
}

function DualChartLayout({ animate }: { animate: boolean }) {
  // Sourced directly from CSC exam data
  const pieData = [
    { label: 'Chinese', value: 30, color: 'text-cyan-400', bg: 'bg-cyan-500', stroke: '#22d3ee' },
    { label: 'Indian', value: 24, color: 'text-amber-400', bg: 'bg-amber-500', stroke: '#fb923c' },
    { label: 'US', value: 20, color: 'text-purple-400', bg: 'bg-purple-500', stroke: '#c084fc' },
    { label: 'Brazilian', value: 16, color: 'text-emerald-400', bg: 'bg-emerald-500', stroke: '#34d399' },
    { label: 'Israeli', value: 10, color: 'text-blue-400', bg: 'bg-blue-500', stroke: '#60a5fa' }
  ]
  
  const total = 100
  const CIRCUMFERENCE = 2 * Math.PI * 14
  const slices = buildPieSlices(pieData, total, CIRCUMFERENCE)
  
  return (
    <div className="w-full flex flex-col gap-6 py-2 text-slate-800 dark:text-slate-100">
      <div className="text-center font-black text-sm tracking-[0.25em] text-cyan-600 dark:text-cyan-400 border-b-2 border-slate-200 dark:border-slate-800 pb-3 uppercase flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
        T.M. Funds - 2011 Portfolio Ledger
      </div>
      
      <div className="chart-panel">
        <GroupedBarChart animate={animate} />
      </div>
      
      <div className="border-t border-dashed border-slate-200 dark:border-slate-800/80 pt-5">
        <div className="text-center font-black text-xs sm:text-sm tracking-[0.25em] mb-5 text-cyan-600 dark:text-cyan-400 uppercase">
          Origin of Insurance Securities
        </div>
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10 w-full chart-panel p-4 sm:p-6">
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Ambient Background Glow */}
            <div className="absolute w-44 h-44 bg-cyan-500/5 rounded-full blur-xl pointer-events-none animate-pulse" />
            
            <svg width="170" height="170" viewBox="0 0 32 32" className="-rotate-90 drop-shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <circle cx="16" cy="16" r="14" className="fill-slate-100 dark:fill-slate-950" stroke="var(--chart-grid)" strokeWidth="0.5" />
              {slices.map(({ d, i, dash, gap, dashOffset }) => (
                <circle
                  key={i}
                  cx="16"
                  cy="16"
                  r="14"
                  fill="transparent"
                  stroke={d.stroke}
                  strokeWidth="4"
                  strokeDasharray={animate ? `${dash} ${gap}` : '0 100'}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700 ease-out hover:stroke-5 cursor-pointer"
                  style={{ transitionDelay: `${i * 80}ms` }}
                />
              ))}
              {/* Inner Donut mask for high-tech look */}
              <circle cx="16" cy="16" r="9.5" className="fill-slate-100 dark:fill-slate-950" stroke="var(--chart-grid)" strokeWidth="0.5" />
            </svg>
            
            {/* Center Label */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Total</span>
              <span className="text-base font-mono font-black text-slate-800 dark:text-slate-100">100%</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2.5 w-full sm:w-56 max-w-md">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs sm:text-sm bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-3.5 h-3.5 rounded-sm shrink-0 ${d.bg} shadow-[0_0_8px_rgba(255,255,255,0.15)]`} />
                  <span className="text-slate-700 dark:text-slate-300 font-bold tracking-wide truncate">{d.label}</span>
                </div>
                <span className={`${d.color} font-mono font-black text-[15px]`}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FdiBarChart({ data, animate }: { data: ChartDataPoint[]; animate: boolean }) {
  const max = 35 // FDI scale goes up to 35
  
  return (
    <div className="w-full text-slate-800 dark:text-slate-200 py-1">
      <div className="text-center font-black text-xs sm:text-sm tracking-[0.25em] mb-5 text-orange-600 dark:text-orange-400 uppercase flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-orange-400 animate-pulse shadow-[0_0_8px_#f97316]" />
        Philippines Foreign Direct Investments
      </div>

      <ChartScroll minWidth={420}>
      <div className="flex w-full chart-panel pr-4 pt-2 h-64 sm:h-72">
        <ChartYAxis
          ticks={[0, 5, 10, 15, 20, 25, 30, 35]}
          formatTick={(tick) => `${tick}M`}
        />

        <div className="relative flex-1 min-w-0 h-64 sm:h-72 pt-8 pb-4 flex items-end justify-between gap-1">
        {[0, 5, 10, 15, 20, 25, 30, 35].map((tick) => (
          <div key={tick} className="absolute left-0 right-0 pointer-events-none" style={{ bottom: `${(tick / max) * 100}%`, height: 0 }}>
            <div className="absolute left-0 right-0 border-t border-slate-800/40 dark:border-slate-800/60" />
          </div>
        ))}
        
        <div className="absolute left-0 top-6 bottom-4 border-l-2 border-slate-400 dark:border-slate-600" />
        
        {data.map((d, i) => {
          const pct = (d.value / max) * 100
          return (
            <div key={i} className="flex flex-col items-center flex-1 min-w-11 group z-10 px-0.5 h-full justify-end relative">
              <div className="flex items-end h-48 justify-center w-full relative mb-1">
                {/* Ambient glow behind bar on hover */}
                <div className="absolute w-12 h-44 bg-orange-500/0 group-hover:bg-orange-500/5 rounded-lg blur-md transition-all duration-300 pointer-events-none" />
                
                {/* Highly Visible Value Badge permanently displayed on top */}
                {animate && (
                  <span className="absolute text-[10px] sm:text-[11px] font-mono font-black text-orange-700 dark:text-orange-300 -top-7 bg-white/95 dark:bg-slate-950/90 border border-orange-400/60 dark:border-orange-500/45 px-1.5 py-0.5 rounded-sm shadow-sm tracking-tight whitespace-nowrap">
                    {d.value}
                  </span>
                )}
                
                {/* Orange Neon Bar */}
                <div
                  className="w-5 sm:w-8 bg-linear-to-t from-orange-600 via-orange-500 to-amber-400 rounded-t-[3px] transition-all duration-1000 ease-out relative cursor-pointer shadow-[0_0_8px_rgba(249,115,22,0.25)] hover:shadow-[0_0_15px_rgba(249,115,22,0.6)] group-hover:from-orange-500 group-hover:to-amber-300 group-hover:scale-105"
                  style={{ height: animate ? `${pct}%` : '0%' }}
                />
              </div>
              <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-mono font-bold mt-1.5 tracking-wide group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors text-center leading-tight">
                {d.label}
              </span>
            </div>
          );
        })}
        </div>
      </div>
      </ChartScroll>
      
      <div className="text-center text-[10px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-widest mt-4">
        Amounts expressed in Millions of Pesos
      </div>
    </div>
  )
}

function StudentLineChart({ data, animate }: { data: ChartDataPoint[]; animate: boolean }) {
  const W = 440
  const H = 280
  const PAD = { top: 28, right: 24, bottom: 48, left: 52 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  
  const minVal = 330
  const maxVal = 410
  
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0
  const yScale = (v: number) => {
    return innerH - ((v - minVal) / (maxVal - minVal)) * innerH
  }
  
  const points = data.map((d, i) => ({
    x: PAD.left + i * xStep,
    y: PAD.top + yScale(d.value),
    d
  }))
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
  
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${PAD.top + innerH} L ${points[0].x.toFixed(2)} ${PAD.top + innerH} Z`
    : ''
  
  const totalLen =
    points.length > 1
      ? points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0)
      : 0
    
  return (
    <div className="w-full text-slate-800 dark:text-slate-100 py-1">
      <div className="text-center font-black text-xs sm:text-sm tracking-[0.25em] mb-5 text-blue-600 dark:text-blue-400 uppercase flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse shadow-[0_0_8px_#3b82f6]" />
        Periodical Performance Vector
      </div>

      <ChartScroll minWidth={400}>
      <div className="relative chart-panel min-h-75 sm:min-h-80">
        <svg width="100%" height="auto" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible font-mono min-h-70">
          <defs>
            <linearGradient id="studentAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y Axis Grid Lines & High Visibility Side Numbers */}
          {[330, 340, 350, 360, 370, 380, 390, 400, 410].map((val) => {
            const y = PAD.top + yScale(val)
            return (
              <g key={val}>
                <line x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y} stroke="var(--chart-grid)" strokeWidth="1" strokeDasharray="3 3" />
                <text x={PAD.left - 10} y={y + 4} textAnchor="end" className="text-[11px] sm:text-xs fill-slate-600 dark:fill-slate-300 font-black tabular-nums">{val}</text>
              </g>
            )
          })}
          
          {/* X Axis line */}
          <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="var(--chart-axis)" strokeWidth="2" />
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH} stroke="var(--chart-axis)" strokeWidth="2" />
          
          {/* Area under the line */}
          {animate && areaPath && (
            <path
              d={areaPath}
              fill="url(#studentAreaGrad)"
              className="transition-opacity duration-1000 ease-out"
            />
          )}

          {/* Line Path */}
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLen > 0 ? totalLen : undefined}
            strokeDashoffset={animate || totalLen === 0 ? 0 : totalLen}
            className="transition-[stroke-dashoffset] duration-1000 ease-out drop-shadow-[0_0_8px_rgba(59,130,246,0.45)] dark:stroke-blue-400"
          />
          
          {/* Data Points (Diamonds) & Values */}
          {points.map((p, i) => {
            const dPath = `M ${p.x} ${p.y - 5.5} L ${p.x + 5.5} ${p.y} L ${p.x} ${p.y + 5.5} L ${p.x - 5.5} ${p.y} Z`
            return (
              <g key={i} className="group cursor-pointer">
                {/* Point pulse effect */}
                {animate && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="9"
                    fill="transparent"
                    stroke="#60a5fa"
                    strokeWidth="0.8"
                    className="animate-ping"
                    style={{ animationDuration: '3s', animationDelay: `${i * 150}ms` }}
                  />
                )}
                
                <path
                  d={dPath}
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all duration-300 hover:scale-125"
                  style={{ transitionDelay: `${i * 80}ms`, opacity: animate ? 1 : 0 }}
                />
                
                {/* Highly visible score value badge permanently displayed */}
                {animate && (
                  <g className="transition-all duration-300">
                    <rect
                      x={p.x - 14}
                      y={p.y - 19}
                      width="28"
                      height="11"
                      rx="2"
                      fill="#020617"
                      stroke="#2563eb"
                      strokeWidth="0.8"
                      className="shadow-sm"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10.5}
                      textAnchor="middle"
                      className="fill-blue-300 font-mono font-black text-[9px] sm:text-[9.5px]"
                    >
                      {p.d.value}
                    </text>
                  </g>
                )}
                
                {/* X Axis Labels */}
                <text x={p.x} y={PAD.top + innerH + 18} textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] sm:text-[11px] font-mono font-black tracking-tight">{p.d.label}</text>
              </g>
            )
          })}
          
          {/* Rotated Y-axis label */}
          <text
            x={-PAD.top - (innerH / 2)}
            y={12}
            transform="rotate(-90)"
            textAnchor="middle"
            className="fill-slate-500 dark:fill-slate-400 font-black text-[9px] tracking-[0.2em] uppercase"
          >
            Marks
          </text>
          
          {/* Bottom X-axis title */}
          <text
            x={PAD.left + (innerW / 2)}
            y={H - 5}
            textAnchor="middle"
            className="fill-slate-500 dark:fill-slate-400 font-black text-[9px] tracking-[0.2em] uppercase"
          >
            Periodical Exams (Max 500)
          </text>
        </svg>
      </div>
      </ChartScroll>
    </div>
  )
}

function BirdWatchingTable() {
  const tableData = [
    { day: "Monday", value: "?" },
    { day: "Tuesday", value: "7" },
    { day: "Wednesday", value: "12" },
    { day: "Thursday", value: "11" },
    { day: "Friday", value: "4" },
    { day: "MEAN", value: "8" }
  ]
  
  return (
    <div className="w-full py-2">
      <div className="text-center font-black text-xs sm:text-sm tracking-[0.25em] mb-5 text-indigo-400 uppercase flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
        Steve&apos;s Bird-Watching Registry
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl">
        <table className="w-full text-xs sm:text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 font-black tracking-widest text-[10px] sm:text-[11px] text-slate-400 uppercase">
              <th className="py-4 px-5 border-r border-slate-850">Day / Phase</th>
              <th className="py-4 px-5 text-right">Raptors Logged</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => {
              const isMean = row.day === "MEAN"
              return (
                <tr
                  key={idx}
                  className={`border-b border-slate-850 last:border-0 transition-all duration-150 ${
                    isMean 
                      ? "bg-indigo-950/45 border-t-2 border-slate-800 font-extrabold" 
                      : "hover:bg-slate-900/40"
                  }`}
                >
                  <td className={`py-3 px-5 border-r border-slate-850 flex items-center gap-2 font-bold ${
                    isMean ? "text-indigo-400 tracking-wider" : "text-slate-300"
                  }`}>
                    {isMean && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />}
                    {!isMean && <span className="w-2 h-2 rounded-full bg-slate-700" />}
                    {row.day}
                  </td>
                  <td
                    className={`py-3 px-5 text-right font-mono font-black text-sm sm:text-base ${
                      isMean 
                        ? "text-indigo-300" 
                        : row.value === "?" 
                          ? "text-orange-400 font-black animate-pulse drop-shadow-[0_0_6px_rgba(249,115,22,0.75)] text-base sm:text-lg" 
                          : "text-slate-200"
                    }`}
                  >
                    {row.value}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Chart: Bar ─────────────────────────────────────────────────────────────────
function BarChart({ data, animate }: { data: ChartDataPoint[]; animate: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  const colors = [
    'from-indigo-600 via-indigo-500 to-indigo-400',
    'from-cyan-600 via-cyan-500 to-cyan-400',
    'from-purple-600 via-purple-500 to-purple-400',
    'from-blue-600 via-blue-500 to-blue-400',
    'from-violet-600 via-violet-500 to-violet-400',
  ]
  return (
    <div className="w-full space-y-5 pt-2">
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100)
        return (
          <div key={i} className="space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-300 font-bold">{d.label}</span>
              <span className="font-mono font-black text-indigo-400 dark:text-indigo-300 tabular-nums text-sm sm:text-base">{d.value}</span>
            </div>
            <div className="w-full bg-slate-900/60 h-6 rounded-lg overflow-hidden border border-slate-800/80">
              <div
                className={`bg-linear-to-r ${colors[i % colors.length]} h-full rounded-lg transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.25)]`}
                style={{ width: animate ? `${pct}%` : '0%' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Chart: Pie ─────────────────────────────────────────────────────────────────
function PieChart({ data, animate }: { data: ChartDataPoint[]; animate: boolean }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const CIRCUMFERENCE = 2 * Math.PI * 14
  const strokeColors = ['#6366f1', '#06b6d4', '#a855f7', '#f59e0b', '#10b981']
  const dotColors = ['bg-indigo-500', 'bg-cyan-500', 'bg-purple-500', 'bg-amber-500', 'bg-emerald-500']
  const textColors = ['text-indigo-400', 'text-cyan-400', 'text-purple-400', 'text-amber-400', 'text-emerald-400']

  const slices = buildPieSlices(data, total, CIRCUMFERENCE)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-10 w-full pt-2">
      <div className="relative shrink-0 flex items-center justify-center">
        {/* Glow */}
        <div className="absolute w-44 h-44 bg-indigo-500/5 rounded-full blur-xl pointer-events-none animate-pulse" />
        
        <svg width="170" height="170" viewBox="0 0 32 32" className="-rotate-90 drop-shadow-xl">
          <circle cx="16" cy="16" r="14" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
          {slices.map(({ i, dash, gap, dashOffset }) => (
            <circle
              key={i}
              cx="16"
              cy="16"
              r="14"
              fill="transparent"
              stroke={strokeColors[i % strokeColors.length]}
              strokeWidth="4.5"
              strokeDasharray={animate ? `${dash} ${gap}` : '0 100'}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out hover:stroke-5 cursor-pointer"
              style={{ transitionDelay: `${i * 80}ms` }}
            />
          ))}
          <circle cx="16" cy="16" r="9.5" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
        </svg>
      </div>
      <div className="flex flex-col gap-2.5 w-full sm:w-auto">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs sm:text-sm bg-slate-950/60 border border-slate-800 px-4 py-2 rounded-xl hover:border-slate-700 transition-colors w-full sm:w-56">
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-sm shrink-0 ${dotColors[i % dotColors.length]}`} />
              <span className="text-slate-300 font-bold tracking-wide">{d.label}</span>
            </div>
            <span className={`${textColors[i % textColors.length]} font-mono font-black text-sm sm:text-base`}>
              {d.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chart: Line ────────────────────────────────────────────────────────────────
function LineChart({ data, animate }: { data: ChartDataPoint[]; animate: boolean }) {
  const W = 280
  const H = 140
  const PAD = { top: 16, right: 16, bottom: 32, left: 40 } // Increased left padding for axis numbers
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...data.map((d) => d.value), 1)
  const minVal = Math.min(...data.map((d) => d.value))

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW
  const yScale = (v: number) =>
    innerH - ((v - minVal) / (maxVal - minVal || 1)) * innerH

  const points = data.map((d, i) => ({
    x: PAD.left + i * xStep,
    y: PAD.top + yScale(d.value),
    d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath =
    `M ${points[0].x} ${PAD.top + innerH} ` +
    points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
    ` L ${points[points.length - 1].x} ${PAD.top + innerH} Z`

  const totalLen = points.length > 1
    ? Math.hypot(...points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y)))
    : 200

  return (
    <div className="w-full pt-2">
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        className="overflow-visible"
        style={{ fontFamily: 'monospace' }}
      >
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines & High visibility Y labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = PAD.top + t * innerH
          const val = Math.round(maxVal - t * (maxVal - minVal))
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + innerW}
                y2={y}
                stroke="#1e293b"
                strokeWidth="0.8"
                className="dark:stroke-slate-800/60"
              />
              <text x={PAD.left - 6} y={y + 3.5} fontSize="9.5" className="fill-slate-400 dark:fill-slate-300 font-bold" textAnchor="end">
                {val}
              </text>
            </g>
          )
        })}

        {/* Solid Y-axis and X-axis lines */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + innerH} stroke="#475569" strokeWidth="1.5" />
        <line x1={PAD.left} y1={PAD.top + innerH} x2={PAD.left + innerW} y2={PAD.top + innerH} stroke="#475569" strokeWidth="1.5" />

        {/* Area fill */}
        <path d={areaPath} fill="url(#lineAreaGrad)" className="transition-opacity duration-700" style={{ opacity: animate ? 1 : 0 }} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLen}
          strokeDashoffset={animate ? 0 : totalLen}
          className="transition-all duration-1000 ease-out drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]"
        />

        {/* Data points + labels */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" className="transition-all duration-300 hover:scale-125" />
            
            {/* Highly visible node tag */}
            {animate && (
              <g>
                <rect
                  x={p.x - 12}
                  y={p.y - 15}
                  width="24"
                  height="9"
                  rx="1.5"
                  fill="#030712"
                  stroke="#6366f1"
                  strokeWidth="0.5"
                />
                <text x={p.x} y={p.y - 8.5} fontSize="7.5" className="fill-indigo-300 font-mono font-black" textAnchor="middle">
                  {p.d.value}
                </text>
              </g>
            )}

            <text x={p.x} y={PAD.top + innerH + 14} fontSize="9" className="fill-slate-400 dark:fill-slate-300 font-black" textAnchor="middle">
              {p.d.label.length > 7 ? p.d.label.slice(0, 7) : p.d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Chart: Table ───────────────────────────────────────────────────────────────
function TableChart({ data }: { data: ChartDataPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="w-full pt-2 overflow-hidden">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 shadow-lg">
        <table className="w-full text-xs sm:text-sm border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 font-black tracking-widest text-[10px] sm:text-[11px] text-slate-400 uppercase">
              <th className="py-3.5 px-4 border-r border-slate-850">Department / Division</th>
              <th className="text-right py-3.5 px-4">Units</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr
                key={i}
                className={`border-b border-slate-850 last:border-0 ${d.value === max ? 'bg-indigo-950/40' : 'hover:bg-slate-900/40'} transition-colors`}
              >
                <td className="py-3 px-4 text-slate-200 border-r border-slate-850 flex items-center gap-2.5 font-bold">
                  {d.value === max && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_6px_#818cf8]" />
                  )}
                  {d.value !== max && <span className="w-2 h-2 rounded-full bg-slate-700 shrink-0" />}
                  {d.label}
                </td>
                <td className={`py-3 px-4 text-right font-mono font-black text-sm sm:text-base tabular-nums ${d.value === max ? 'text-indigo-300' : 'text-slate-200'}`}>
                  {d.value.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Loading Screen ─────────────────────────────────────────────────────────────
function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-5">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
        <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-slate-500 text-xs tracking-[0.2em] uppercase">{label}</p>
    </div>
  )
}

// ── Exit Guard Modal ───────────────────────────────────────────────────────────
function ExitGuardModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900 p-8 shadow-2xl shadow-black/60 flex flex-col gap-6"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #0a0f1e 100%)' }}
      >
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        </div>

        {/* Copy */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-100 mb-2">Exit Full Exam?</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Exiting midway will <span className="text-rose-400 font-semibold">disqualify your attempt</span> and mark this session as{' '}
            <span className="text-rose-400 font-semibold">Incomplete</span>. This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            id="btn-confirm-exit"
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rose-600/20"
          >
            Yes, Exit and Disqualify
          </button>
          <button
            id="btn-cancel-exit"
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-all duration-150"
          >
            Continue My Exam
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Inner Exam Component (uses useSearchParams — must be inside Suspense) ────
function ExamEngine() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const moduleParam = searchParams.get('module')
  const modeParam = searchParams.get('mode')
  const isFullExam = modeParam === 'full'

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showExitModal, setShowExitModal] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)

  // ── Auth guard + fetch questions ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUserId(session.user.id)

      let query = supabase.from('questions').select('*')
      if (moduleParam) {
        const correctedString = mapCategoryToDbString(moduleParam)
        query = query.eq('category', correctedString)
      }

      const { data, error } = await query

      if (error) {
        console.error('Supabase fetch error:', error)
        setLoading(false)
        return
      }

      if (data) {
        const processed = (data as Question[]).map(normalizeQuestion)
        setQuestions(isFullExam ? groupAndShuffleQuestions(processed) : processed)
      }

      // If full exam, create an exam_sessions row
      if (isFullExam && session.user.id) {
        const { data: sessData } = await supabase
          .from('exam_sessions')
          .insert({
            user_id: session.user.id,
            mode: 'full',
            status: 'in_progress',
            started_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (sessData) setSessionId(sessData.id)
      }

      setLoading(false)
    }
    init()
  }, [moduleParam, isFullExam, router])

  // ── Auto-save module progress ─────────────────────────────────────────────
  const saveModuleProgress = useCallback(async () => {
    if (!userId || !moduleParam || isFullExam) return
    setIsSaving(true)
    try {
      await supabase.from('user_progress').upsert(
        {
          user_id: userId,
          category: moduleParam,
          last_question_index: currentIndex,
          answered_count: Object.keys(selectedAnswers).length,
          total_questions: questions.length,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category' },
      )
    } catch (err) {
      console.error('Progress save error:', err)
    } finally {
      setIsSaving(false)
    }
  }, [userId, moduleParam, isFullExam, currentIndex, selectedAnswers, questions.length])

  // ── Handle "Back to Dashboard" for module mode ────────────────────────────
  const handleBackToDashboard = useCallback(async () => {
    await saveModuleProgress()
    router.push('/dashboard')
  }, [saveModuleProgress, router])

  // ── Handle exit attempt for full exam mode ────────────────────────────────
  const handleExitAttempt = useCallback(() => {
    if (isFullExam) {
      setShowExitModal(true)
    } else {
      handleBackToDashboard()
    }
  }, [isFullExam, handleBackToDashboard])

  // ── Confirm full-exam disqualification ────────────────────────────────────
  const handleConfirmExit = useCallback(async () => {
    if (sessionId) {
      await supabase
        .from('exam_sessions')
        .update({ status: 'disqualified', ended_at: new Date().toISOString() })
        .eq('id', sessionId)
    }
    setShowExitModal(false)
    router.push('/dashboard')
  }, [sessionId, router])

  // ── Submit exam ───────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    let correct = 0
    questions.forEach((q) => {
      if (selectedAnswers[q.id]?.toLowerCase() === q.correct_answer?.toLowerCase()) {
        correct++
      }
    })
    setScore({ correct, total: questions.length })

    if (isFullExam && sessionId) {
      await supabase
        .from('exam_sessions')
        .update({
          status: 'completed',
          score: correct,
          total_questions: questions.length,
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId)
    }

    if (!isFullExam && userId && moduleParam) {
      await supabase.from('user_progress').upsert(
        {
          user_id: userId,
          category: moduleParam,
          last_question_index: questions.length - 1,
          answered_count: Object.keys(selectedAnswers).length,
          total_questions: questions.length,
          score: correct,
          completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category' },
      )
    }

    setSubmitted(true)
  }, [questions, selectedAnswers, isFullExam, sessionId, userId, moduleParam])

  // ── Derived helpers ───────────────────────────────────────────────────────
  const getFriendlyModuleLabel = (param: string | null): string => {
    if (!param) return isFullExam ? 'Full Diagnostic Exam' : 'General Ability'
    
    const friendlyMap: Record<string, string> = {
      'graphs_charts_data': 'Graphs / Charts / Data',
      'vocabulary': 'Vocabulary',
      'idiomatic_grammar': 'Idiomatic Expressions & Grammar',
      'analogy_logic': 'Analogy and Logic Test',
      'reading_comprehension': 'Reading Comprehension',
      'paragraph_organization': 'Paragraph Organization',
      'clerical_operations': 'Clerical Operations',
      'constitution_general_info': 'Constitution & General Information',
      'numerical_reasoning': 'Numerical Reasoning',
      'Graphs / Charts / Data': 'Graphs / Charts / Data',
      'Verbal Ability': 'Verbal Ability',
      'Numerical Ability': 'Numerical Ability'
    }
    
    const normalized = param.toLowerCase().replace(/_/g, ' ').trim()
    for (const [k, v] of Object.entries(friendlyMap)) {
      if (k.toLowerCase().replace(/_/g, ' ').trim() === normalized) {
        return v
      }
    }
    return param.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const moduleLabel = getModuleLabel(moduleParam, isFullExam)

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen label="Loading exam questions" />

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">No questions found for this module.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium border border-slate-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (submitted && score) {
    const pct = Math.round((score.correct / score.total) * 100)
    const passed = pct >= 70
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div
          className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-10 flex flex-col items-center gap-8 shadow-2xl"
          style={{ background: 'linear-gradient(160deg, #0f172a, #0a0f1e)' }}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${passed ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
            {passed ? (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
          </div>

          <div className="text-center">
            <p className="text-slate-500 text-xs tracking-widest uppercase mb-2">{moduleLabel}</p>
            <h1 className="text-5xl font-black text-slate-100 tabular-nums">{pct}%</h1>
            <p className={`text-sm font-semibold mt-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passed ? 'Excellent Work — Passed' : 'Needs Improvement — Failed'}
            </p>
          </div>

          <div className="w-full grid grid-cols-3 gap-3">
            {[
              { label: 'Correct', value: score.correct, color: 'text-emerald-400' },
              { label: 'Incorrect', value: score.total - score.correct, color: 'text-rose-400' },
              { label: 'Total', value: score.total, color: 'text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-center">
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-slate-600 text-[11px] mt-1 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          <button
            id="btn-return-dashboard"
            onClick={() => router.push('/dashboard')}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-150 hover:scale-[1.02] shadow-lg shadow-indigo-600/20"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Active exam rendering ─────────────────────────────────────────────────
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(selectedAnswers).length

  let parsedChartData: ChartDataPoint[] = []
  if (currentQuestion.chart_data) {
    try {
      parsedChartData = typeof currentQuestion.chart_data === 'string'
        ? JSON.parse(currentQuestion.chart_data)
        : currentQuestion.chart_data
    } catch (e) {
      console.error('Error parsing chart data:', e)
    }
  }

  // Visual database questions fallback block to map values perfectly
  // These values are sourced directly from the CSC exam images
  if (!parsedChartData || parsedChartData.length === 0) {
    const t = currentQuestion.chart_type ? currentQuestion.chart_type.toLowerCase() : ''
    if (t.includes('fdi')) {
      parsedChartData = [
        { label: '1992', value: 5.7 },
        { label: '1993', value: 10.15 },
        { label: '1994', value: 12.16 },
        { label: '1995', value: 10.22 },
        { label: '1996', value: 24.23 },
        { label: '1997', value: 31.36 },
      ]
    } else if (t.includes('student')) {
      parsedChartData = [
        { label: 'Apr-01', value: 360 },
        { label: 'Jun-01', value: 365 },
        { label: 'Aug-01', value: 370 },
        { label: 'Oct-01', value: 385 },
        { label: 'Dec-01', value: 400 },
        { label: 'Feb-02', value: 405 },
      ]
    } else if (t.includes('insurance')) {
      parsedChartData = [
        { label: 'Chinese', value: 30 },
        { label: 'Indian', value: 24 },
        { label: 'US', value: 20 },
        { label: 'Brazilian', value: 16 },
        { label: 'Israeli', value: 10 },
      ]
    } else if (t.includes('bird') || t.includes('table')) {
      parsedChartData = [
        { label: 'Monday', value: 6 },
        { label: 'Tuesday', value: 7 },
        { label: 'Wednesday', value: 12 },
        { label: 'Thursday', value: 11 },
        { label: 'Friday', value: 4 },
      ]
    }
  }

  const options = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
  ].filter((o) => !!o.text)

  const visualizerType = getChartVisualizerType(currentQuestion.chart_type)
  const hasChart = !!visualizerType && parsedChartData.length > 0
  const chartAnimationKey = `${currentIndex}-${currentQuestion.id}`
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100)

  return (
    <>
      {showExitModal && (
        <ExitGuardModal
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-300">

        {/* ── Sidebar Progress Tracker ──────────────────────────────────────── */}
        <aside className="w-72 shrink-0 bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800/60 hidden md:flex flex-col">
          {/* Sidebar header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-blue-600 dark:text-blue-400 font-bold text-xs tracking-wider">CSC PORTAL</p>
                <p className="text-slate-500 dark:text-slate-600 text-[10px] tracking-widest uppercase truncate">{moduleLabel}</p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Progress</span>
                <span className="text-slate-400 font-mono tabular-nums">{answeredCount} / {questions.length}</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Question grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[10px] text-slate-500 dark:text-slate-600 uppercase tracking-widest mb-3">Question Map</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const isActive = currentIndex === idx
                const isAnswered = !!selectedAnswers[q.id]
                return (
                  <button
                    key={idx}
                    id={`q-nav-${idx + 1}`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold border transition-all duration-150 ${isActive
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/25 scale-105'
                        : isAnswered
                          ? 'bg-blue-600/15 border-blue-300 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 hover:border-blue-500/50'
                          : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-400'
                      }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 space-y-2">
            <button
              id="btn-submit-exam"
              onClick={handleSubmit}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-semibold text-sm transition-all duration-150 hover:scale-[1.01] shadow-lg shadow-emerald-600/15 text-white"
            >
              Submit Exam
            </button>
            <button
              id="btn-back-dashboard"
              onClick={handleExitAttempt}
              disabled={isSaving}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700/50 transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to Dashboard
                </>
              )}
            </button>
          </div>
        </aside>

        {/* ── Main Workspace ────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Top progress bar */}
          <div className="h-1 bg-slate-200 dark:bg-slate-900 shrink-0">
            <div
              className="h-full bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Header bar */}
          <header className="shrink-0 flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                {currentQuestion.category?.replace(/_/g, ' ') || moduleLabel}
              </span>
              {isFullExam && (
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Full Exam
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <ThemeToggleButton className="w-10 h-10 shrink-0" />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentIndex + 1}</span>
                <span className="text-slate-400 dark:text-slate-600"> / </span>
                <span>{questions.length}</span>
              </span>
              {/* Mobile: back button */}
              <button
                id="btn-exit-mobile"
                onClick={handleExitAttempt}
                className="max-md:inline-flex md:hidden items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Exit
              </button>
            </div>
          </header>

          {/* ── Question workspace ──────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-8">

              {hasChart ? (
                /* ── 2-Column layout for chart questions ─────────────────── */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                  {/* Left: Visualizer Canvas */}
                  <div className={currentQuestion.chart_type === 'insurance_pie_chart' ? "lg:col-span-6" : "lg:col-span-5"}>
                    <div
                      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4 sm:p-6 flex flex-col shadow-sm dark:shadow-none ${
                        currentQuestion.chart_type === 'insurance_pie_chart' ? 'min-h-105 sm:min-h-120' : 'min-h-70 sm:min-h-85'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse shrink-0" />
                          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-600 tracking-[0.2em] truncate">
                            Data Source Matrix
                          </span>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400/90 bg-blue-500/10 px-2 py-0.5 rounded shrink-0">
                          {String(currentQuestion.chart_type).toUpperCase()}
                        </span>
                      </div>

                      <div
                        key={chartAnimationKey}
                        className="flex-1 flex items-stretch justify-center w-full min-h-0 overflow-x-auto overflow-y-visible"
                      >
                        {currentQuestion.chart_type === 'insurance_pie_chart' ? (
                          <DualChartLayout animate />
                        ) : currentQuestion.chart_type === 'fdi_bar_chart' ? (
                          <FdiBarChart data={parsedChartData} animate />
                        ) : currentQuestion.chart_type === 'student_line_chart' ? (
                          <StudentLineChart data={parsedChartData} animate />
                        ) : currentQuestion.chart_type === 'bird_data_table' ? (
                          <BirdWatchingTable />
                        ) : visualizerType === 'bar' ? (
                          <BarChart data={parsedChartData} animate />
                        ) : visualizerType === 'pie' ? (
                          <PieChart data={parsedChartData} animate />
                        ) : visualizerType === 'line' ? (
                          <LineChart data={parsedChartData} animate />
                        ) : visualizerType === 'table' ? (
                          <TableChart data={parsedChartData} />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right: Question Desk */}
                  <div className={currentQuestion.chart_type === 'insurance_pie_chart' ? "lg:col-span-6 flex flex-col gap-5" : "lg:col-span-7 flex flex-col gap-5"}>
                    <QuestionDesk
                      question={currentQuestion}
                      options={options}
                      selectedAnswers={selectedAnswers}
                      setSelectedAnswers={setSelectedAnswers}
                    />
                  </div>
                </div>
              ) : (
                /* ── 1-Column layout for text-only questions ─────────────── */
                <div className="max-w-2xl mx-auto flex flex-col gap-5">
                  <QuestionDesk
                    question={currentQuestion}
                    options={options}
                    selectedAnswers={selectedAnswers}
                    setSelectedAnswers={setSelectedAnswers}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Navigation Row ─────────────────────────────────────── */}
          <footer className="shrink-0 border-t border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm px-6 py-4">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <button
                id="btn-prev-question"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((p) => p - 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 transition-all duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Previous
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-600">
                {questions.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((_, ri) => {
                  const idx = Math.max(0, currentIndex - 2) + ri
                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-7 h-7 rounded-lg font-mono text-xs transition-all duration-150 ${idx === currentIndex
                          ? 'bg-blue-600 text-white font-bold scale-110'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {currentIndex === questions.length - 1 ? (
                <button
                  id="btn-submit-footer"
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] shadow-lg shadow-emerald-600/20"
                >
                  Submit Exam
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              ) : (
                <button
                  id="btn-next-question"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((p) => p + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all duration-150 hover:scale-[1.02] shadow-lg shadow-blue-600/20"
                >
                  Next
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>
    </>
  )
}

// ── Question Desk Component ────────────────────────────────────────────────────
function QuestionDesk({
  question,
  options,
  selectedAnswers,
  setSelectedAnswers,
}: {
  question: Question
  options: { key: string; text: string }[]
  selectedAnswers: Record<string, string>
  setSelectedAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>
}) {
  return (
    <>
      {/* Question text */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 p-6 shadow-sm">
        <p className="text-slate-800 dark:text-slate-200 text-base md:text-[17px] leading-relaxed font-medium">
          {question.question_text}
        </p>
      </div>

      {/* Answer options */}
      <div className="flex flex-col gap-2.5">
        {options.map((option) => {
          const isSelected = selectedAnswers[question.id] === option.key
          return (
            <button
              key={option.key}
              id={`option-${question.id}-${option.key}`}
              onClick={() =>
                setSelectedAnswers((prev) => ({ ...prev, [question.id]: option.key }))
              }
              className={`w-full text-left px-4 py-4 rounded-xl border flex items-center gap-4 transition-all duration-150 group ${isSelected
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-700 dark:text-blue-300 shadow-sm shadow-blue-600/10 hover:scale-[1.01]'
                  : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700/70 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:text-slate-800 dark:hover:text-slate-300 hover:scale-[1.01]'
                }`}
            >
              <span
                className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold border transition-all duration-150 ${isSelected
                    ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/30'
                    : 'bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700/50 text-slate-500 group-hover:border-slate-400 dark:group-hover:border-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-400'
                  }`}
              >
                {option.key}
              </span>
              <span className="text-sm leading-snug flex-1">{option.text}</span>
              {isSelected && (
                <svg
                  className="shrink-0 text-blue-600 dark:text-blue-400"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Page Export: wraps ExamEngine in Suspense per Next.js requirement ──────────
export default function ExamPage() {
  return (
    <Suspense fallback={<LoadingScreen label="Initializing exam engine" />}>
      <ExamEngine />
    </Suspense>
  )
}
