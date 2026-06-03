'use client'

import { useState } from 'react'
import { supabase } from '@/utils/supabase'
import { useTheme, ThemeToggleButton } from './components/ThemeProvider'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('success')
  const { mounted } = useTheme()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      if (error) {
        setMessageType('error')
        setMessage(error.message)
      } else {
        setMessageType('success')
        setMessage('Registration successful! Check your email for a verification link.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMessageType('error')
        setMessage(error.message)
      } else {
        window.location.href = '/dashboard'
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans p-6 relative overflow-hidden transition-colors duration-300">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-indigo-500/5 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 dark:opacity-20 pointer-events-none" />

      {/* Theme Toggle Button (from shared provider) */}
      <ThemeToggleButton className="absolute top-6 right-6" />

      {/* Auth Card */}
      <div className={`w-full max-w-[440px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 sm:p-10 shadow-2xl relative transition-all duration-550 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        
        {/* Accent top line */}
        <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-700" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              Republic of the Philippines
            </span>
            <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-700" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase leading-none mb-3">
            CSC <span className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">Digital</span><br />Reviewer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            {isRegistering
              ? 'Create your account to start your exam preparation'
              : 'Sign in to access your mock exams and progress'}
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {isRegistering && (
            <div className="space-y-1.5 animate-enter">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</label>
              <input
                type="text"
                required
                placeholder="Juan Dela Cruz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-100/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold tracking-widest text-xs uppercase rounded-xl cursor-pointer shadow-lg hover:shadow-xl hover:shadow-blue-500/20 active:scale-98 transition-all duration-150"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1">
                Processing
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.2s]">.</span>
                <span className="animate-bounce [animation-delay:0.4s]">.</span>
              </span>
            ) : isRegistering ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Message Indicator */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-xs text-center border font-medium ${
            messageType === 'success'
              ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/8 border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}>
            {message}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <span className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">or</span>
          <span className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Toggle Option Link */}
        <button
          type="button"
          onClick={() => { setIsRegistering(!isRegistering); setMessage(''); }}
          className="w-full text-center py-2 bg-transparent border-0 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
        >
          {isRegistering ? (
            <>Already have an account? <span className="text-blue-600 dark:text-blue-400 font-extrabold ml-1">Sign In</span></>
          ) : (
            <>New to CSC Portal? <span className="text-blue-600 dark:text-blue-400 font-extrabold ml-1">Create an Account</span></>
          )}
        </button>

      </div>
    </div>
  )
}
