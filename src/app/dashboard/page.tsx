'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { EXAM_MODULES, type ExamModuleConfig, type ExamModuleId } from '@/lib/examModules'
import { supabase } from '@/utils/supabase'
import { useTheme, ThemeToggleButton } from '../components/ThemeProvider'

// ── Types ──────────────────────────────────────────────────────────────────────
type ExamStatus = 'not_started' | 'in_progress' | 'completed'

interface UserProgressRow {
  category: string
  score: number | null
  completed?: boolean
  answered_count?: number
  total_questions?: number
}

type DashboardExamModule = ExamModuleConfig & {
  status: ExamStatus
  progress?: number
  icon: React.ReactNode
}

// ── Exact Modules From The Provided PDF Reviewer ───────────────────────────────
const MODULE_ICONS: Record<ExamModuleId, React.ReactNode> = {
  graphs_charts_data: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  vocabulary: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  idiomatic_grammar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  analogy_logic: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  reading_comprehension: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  paragraph_organization: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  ),
  clerical_operations: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  constitution_general_info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  numerical_reasoning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
}

const DASHBOARD_MODULES: DashboardExamModule[] = EXAM_MODULES.map((moduleConfig) => ({
  ...moduleConfig,
  status: 'not_started',
  icon: MODULE_ICONS[moduleConfig.id],
}))

const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'terms',
    label: 'Terms & Conditions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
]

function StatusBadge({ status }: { status: ExamStatus }) {
  const config = {
    not_started: {
      label: 'Not Started',
      className: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      dot: 'bg-slate-400 dark:bg-slate-500',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
      dot: 'bg-blue-500',
    },
    completed: {
      label: 'Completed',
      className: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
      dot: 'bg-emerald-500',
    },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-wide uppercase border ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}

function MetricCard({
  label, value, sub, accent, icon,
}: {
  label: string
  value: string
  sub: string
  accent: string
  icon: React.ReactNode
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 p-5 sm:p-6 flex flex-col gap-3 group transition-all duration-300 hover:border-slate-350 dark:hover:border-slate-700 shadow-xs hover:shadow-md"
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at top right, ${accent}, transparent 70%)` }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{sub}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [activeNav, setActiveNav] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  useTheme()

  const [modules, setModules] = useState<DashboardExamModule[]>(DASHBOARD_MODULES)
  const [accuracy, setAccuracy] = useState<string>('0.0%')

  const [isTermsOpen, setIsTermsOpen] = useState(false)
  const [isTermsVisible, setIsTermsVisible] = useState(false)

  useEffect(() => {
    if (activeNav === 'terms') {
      setIsTermsOpen(true)
      const timer = setTimeout(() => setIsTermsVisible(true), 50)
      return () => clearTimeout(timer)
    } else {
      setIsTermsVisible(false)
      const timer = setTimeout(() => setIsTermsOpen(false), 300)
      return () => clearTimeout(timer)
    }
  }, [activeNav])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/')
        return
      }
      setUser(session.user)

      try {
        // Fetch real-time user progress from Supabase
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', session.user.id)

        if (progressData && progressData.length > 0) {
          let totalCorrect = 0
          let totalAnswered = 0

          const updated = DASHBOARD_MODULES.map((mod) => {
            const p = progressData.find((row: UserProgressRow) => row.category === mod.id)
            if (p) {
              if (p.score !== null && p.score !== undefined) {
                totalCorrect += p.score
                totalAnswered += p.answered_count || p.total_questions || 0
              }
              return {
                ...mod,
                status: (p.completed ? 'completed' : 'in_progress') as ExamStatus,
                progress: p.total_questions > 0 ? Math.round((p.answered_count / p.total_questions) * 100) : 0
              }
            }
            return mod
          })

          setModules(updated)

          if (totalAnswered > 0) {
            const accPct = ((totalCorrect / totalAnswered) * 100).toFixed(1)
            setAccuracy(`${accPct}%`)
          }
        }
      } catch (err) {
        console.error('Error fetching progress data:', err)
      }
    }
    checkUser()
  }, [router])



  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm tracking-widest uppercase font-bold animate-pulse">Loading</p>
        </div>
      </div>
    )
  }

  const completedCount = modules.filter((e) => e.status === 'completed').length
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const userInitial = userName.charAt(0).toUpperCase()
  const totalQuestions = modules.reduce((sum, m) => sum + m.questionCount, 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex font-sans transition-colors duration-300">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0 sm:w-16'} shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-all duration-300 ease-in-out relative z-10`}>
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800 gap-3 overflow-hidden shrink-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-blue-600 dark:text-blue-400 font-black tracking-wider text-sm leading-none">CSC PORTAL</p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] tracking-widest uppercase mt-0.5 font-bold">Review Center</p>
              </div>
            )}
          </div>

          <nav className="flex-1 px-3 py-6 flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeNav === item.id
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 text-left border cursor-pointer ${isActive
                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-600 dark:text-blue-400 font-black'
                      : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                    }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="truncate uppercase tracking-wider text-[11px] sm:text-xs">{item.label}</span>}
                </button>
              )
            })}
          </nav>

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
            <div className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl border border-slate-150 dark:border-slate-900 bg-white dark:bg-slate-900/30 shadow-xs ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="w-8 h-8 shrink-0 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-md">
                {userInitial}
              </div>
              {sidebarOpen && (
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-slate-700 dark:text-slate-300 text-xs font-bold truncate">{userName}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold truncate">{user.email}</p>
                </div>
              )}
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent transition-all duration-150 text-left cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {sidebarOpen && <span className="uppercase tracking-wider text-[10px] sm:text-xs">Log Out</span>}
            </button>
          </div>
        </div>

        {/* Collapsible toggle sidebar button */}
        <button
          id="btn-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-18 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hidden sm:flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors z-20 cursor-pointer"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>

      {/* ── Main Viewport ──────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Top Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sm:hidden w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">DASHBOARD</h1>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Header Theme Toggle */}
            <ThemeToggleButton className="w-10 h-10" />

            <a
              id="btn-start-full-exam"
              href="/exam?mode=full"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs sm:text-sm font-black text-white transition-all duration-150 hover:scale-[1.02] shadow-lg shadow-blue-500/20 uppercase tracking-wider cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="shrink-0">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span className="hidden sm:inline">Start Full Exam</span>
              <span className="sm:hidden">Full Exam</span>
            </a>
          </div>
        </header>

        {/* Scrollable View */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-8">
          
          {/* Welcome Card */}
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Welcome back, <span className="text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded-lg border border-blue-500/10">{user.email?.split('@')[0]}</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">Pick a specific subject module below to begin your mock tests and build review analytics.</p>
          </div>

          {/* Analytics Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <MetricCard
              label="Average Accuracy"
              value={accuracy}
              sub={accuracy !== '0.0%' ? 'Based on all answered questions' : 'Complete tests to gauge metrics'}
              accent="#3b82f6"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
            />
            <MetricCard
              label="Completed Modules"
              value={`${completedCount} / ${DASHBOARD_MODULES.length}`}
              sub="9 baseline categories total"
              accent="#10b981"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="9 15 11 17 15 13" />
                </svg>
              }
            />
            <MetricCard
              label="Total Questions"
              value={String(totalQuestions)}
              sub="Across all 9 reviewer modules"
              accent="#f59e0b"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
          </div>

          {/* PDF-Aligned Exam Module Grid Section */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/80 pb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-500 dark:text-slate-400 tracking-wider uppercase">Mock Exam Categories</h3>
              <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-bold">Select a designated focal focus division from your review document</p>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded-full font-mono font-bold self-start sm:self-center">
              {completedCount} / {modules.length} Modules Complete
            </span>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {modules.map((exam) => (
              <a
                key={exam.id}
                id={`module-card-${exam.id}`}
                href={`/exam?module=${exam.id}`}
                className="group relative flex items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/10 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer no-underline"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at left center, ${exam.accentColor}06, transparent 60%)` }}
                />
                <div className="flex items-start gap-4 flex-1 min-w-0 relative">
                  {/* Category Accent Icon Wrapper */}
                  <div
                    className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center mt-0.5 transition-all duration-200 group-hover:scale-110 shadow-xs border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    style={{ color: exam.accentColor }}
                  >
                    {exam.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white transition-colors truncate mb-1">
                      {exam.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mb-3 font-semibold">
                      {exam.subtitle}
                    </p>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={exam.status} />
                      {exam.progress !== undefined && exam.progress > 0 && (
                        <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-mono font-black">({exam.progress}% Done)</span>
                      )}
                      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono font-bold">{exam.questionCount} Questions</span>
                    </div>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="shrink-0 ml-4 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 flex items-center justify-center transition-all duration-200">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="translate-x-0 group-hover:translate-x-0.5 transition-transform"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </a>
            ))}
          </div>

          <div className="h-10" />
        </div>
      </main>

      {/* ── Terms & Conditions Modal Overlay ────────────────────────── */}
      {isTermsOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/35 dark:bg-slate-950/65 backdrop-blur-xs transition-all duration-300 ease-in-out ${
            isTermsVisible ? 'opacity-100 backdrop-blur-md' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setActiveNav('dashboard')}
        >
          <div
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden transition-all duration-300 transform ease-in-out ${
              isTermsVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight uppercase">Terms & Conditions</h2>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Last updated: June 2026</p>
                </div>
              </div>
              
              <button
                onClick={() => setActiveNav('dashboard')}
                aria-label="Close terms"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 scrollbar-thin">
              {/* Section 1 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">01</span>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Use of Website</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                  The materials provided on this website are intended solely for educational and review purposes. While we strive to provide accurate and updated content, the CSC Reviewer Platform does not guarantee success in any Civil Service Examination or other government-related examinations.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">02</span>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">User Responsibilities</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                  By using this website, you agree to use the content only for personal, non-commercial study purposes. You must not attempt to gain unauthorized access, disrupt the platform's functionality, or misuse any part of the service.
                </p>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">03</span>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Termination of Access</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                  We reserve the right to suspend or terminate access to the platform if a user violates these Terms and Conditions, engages in fraudulent activities, or attempts to compromise the integrity and security of the website.
                </p>
              </div>

              {/* Section 4: Disclaimer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">Disclaimer & Attributions</h3>
                </div>
                <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p>
                    CSC Reviewer Platform is an independent educational project and is not affiliated with, endorsed by, or connected to the Civil Service Commission (CSC), Professional Regulation Commission (PRC), or any other government agency.
                  </p>
                  <p>
                    Practice questions, quizzes, and reviewer materials are based on or adapted from publicly available reviewer resources, including materials published by Teach Pinas. All respective rights to original content remain with their respective owners.
                  </p>
                  <p>
                    The platform is intended solely as a study aid and review tool. Content provided on this website may not reflect actual examination questions and does not guarantee examination results or passing scores.
                  </p>
                </div>
              </div>

              {/* Section 5: Source Reference */}
              <div className="space-y-2 pl-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source Reference</h4>
                <a
                  href="https://www.teachpinas.com/civil-service-exam-reviewer-pdf-with-answer-keys/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-600/5 transition-all duration-150 cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>Teach Pinas CSC Reviewer PDF</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60">
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setActiveNav('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-xs font-black text-white dark:text-slate-900 uppercase tracking-wider transition-all duration-150 hover:scale-[1.02] cursor-pointer"
              >
                I Understand & Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
