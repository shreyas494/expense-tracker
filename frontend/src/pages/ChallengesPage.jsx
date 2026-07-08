import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { 
  Trophy, Plus, Trash2, Calendar, Shield, Zap, Flame, 
  CheckCircle2, AlertCircle, X, Info, Award, HelpCircle
} from 'lucide-react'
import { challengeStyles } from '../assets/dummyStyles'

const BASE_URL = 'http://localhost:4000/api/challenges'

const CATEGORIES = ['Food', 'Housing', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Other']

const BADGES_LIST = [
  { id: 'Savings Rookie', name: 'Savings Rookie', desc: 'Achieved by completing any daily savings milestone.', icon: '🌱' },
  { id: 'Streak Warrior', name: 'Streak Warrior', desc: 'Achieved by keeping a consecutive daily save streak of 7+ days.', icon: '⚔️' },
  { id: 'Savings Emperor', name: 'Savings Emperor', desc: 'Achieved by keeping a consecutive daily save streak of 30+ days.', icon: '👑' },
  { id: 'Self Control Master', name: 'Self Control Master', desc: 'Achieved by successfully keeping a category spending fast.', icon: '🥋' },
  { id: 'Budget Ninja', name: 'Budget Ninja', desc: 'Achieved by successfully spending under your budget limit.', icon: '🥷' }
]

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [challengeType, setChallengeType] = useState('daily_save') // 'daily_save', 'category_fast', 'spend_limit'
  const [targetValue, setTargetValue] = useState('')
  const [categoryLimit, setCategoryLimit] = useState('Food')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0])

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  const [showToast, setShowToast] = useState(false)

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const getHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchChallenges = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${BASE_URL}/list`, { headers: getHeaders() })
      if (res.data.success) {
        setChallenges(res.data.challenges)
      }
    } catch (err) {
      console.error('Error loading challenges:', err)
      triggerToast('Failed to load challenges', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [])

  // Auto-fill default title when form inputs change
  useEffect(() => {
    if (!title) {
      if (challengeType === 'daily_save') {
        setTitle(`Save ₹${targetValue || 100} daily`)
      } else if (challengeType === 'category_fast') {
        setTitle(`No ${categoryLimit} spending`)
      } else if (challengeType === 'spend_limit') {
        setTitle(`Limit spending to ₹${targetValue || 5000}`)
      }
    }
  }, [challengeType, targetValue, categoryLimit])

  // Stats summaries
  const stats = useMemo(() => {
    const active = challenges.filter(c => c.status === 'active')
    const completed = challenges.filter(c => c.status === 'completed')
    
    // Unify all earned badges from all challenges
    const badges = new Set()
    challenges.forEach(c => {
      c.earnedBadges?.forEach(b => badges.add(b))
    })

    // Compute max streak
    const maxActiveStreak = active.reduce((max, c) => Math.max(max, c.streak || 0), 0)

    return {
      activeCount: active.length,
      completedCount: completed.length,
      longestStreak: maxActiveStreak,
      earnedBadgesCount: badges.size,
      earnedBadgesList: Array.from(badges)
    }
  }, [challenges])

  // Create Challenge submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      title,
      description,
      challengeType,
      targetValue: Number(targetValue),
      categoryLimit: challengeType === 'category_fast' ? categoryLimit : undefined,
      startDate,
      endDate
    }

    try {
      const res = await axios.post(`${BASE_URL}/create`, payload, { headers: getHeaders() })
      if (res.data.success) {
        triggerToast('Challenge started! Good luck!')
        setIsModalOpen(false)
        setTitle('')
        setDescription('')
        setTargetValue('')
        fetchChallenges()
      }
    } catch (err) {
      console.error('Error starting challenge:', err)
      setError(err.response?.data?.message || 'Failed to start challenge')
    } finally {
      setSubmitting(false)
    }
  }

  // Abandon Challenge
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to abandon this challenge? Progress will be lost.')) return
    try {
      const res = await axios.delete(`${BASE_URL}/${id}`, { headers: getHeaders() })
      if (res.data.success) {
        triggerToast('Challenge abandoned')
        fetchChallenges()
      }
    } catch (err) {
      console.error('Error deleting challenge:', err)
      triggerToast('Failed to abandon challenge', 'error')
    }
  }

  return (
    <div className={challengeStyles.container}>
      
      {/* Toast alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2 ${
              toastType === 'error' 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            {toastType === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className={challengeStyles.header}>
        <div>
          <h1 className={challengeStyles.title}>
            <Trophy className="w-7 h-7 text-orange-500" />
            Savings Challenges
          </h1>
          <p className={challengeStyles.subtitle}>
            Gamify your financial journey. Build streaks, lock categories, and win badges!
          </p>
        </div>
        <button
          onClick={() => {
            setTitle('')
            setDescription('')
            setTargetValue('')
            setError('')
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl text-sm shadow cursor-pointer transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          New Challenge
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Active Milestones</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{stats.activeCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Active Streak</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{stats.longestStreak} days</p>
          </div>
          <div className="p-3 rounded-xl bg-orange-50 text-orange-500">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Badges Unlocked</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{stats.earnedBadgesCount} / {BADGES_LIST.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Challenges Section */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-3"></div>
          <p className="text-gray-500 text-xs font-semibold">Updating streaks & badges...</p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-150 rounded-2xl p-8 max-w-lg mx-auto">
          <Trophy className="w-12 h-12 text-orange-200 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No active challenges</h3>
          <p className="text-gray-400 text-xs mt-1">
            Start a challenge to lock categories or commit to daily targets. Streaks will auto-evaluate when you log transactions!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-5 inline-flex items-center gap-1.5 px-4.5 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl text-xs shadow cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Start Challenge
          </button>
        </div>
      ) : (
        <div className={challengeStyles.grid}>
          {challenges.map(c => {
            const daysLimit = Math.round((new Date(c.endDate) - new Date(c.startDate)) / (1000 * 60 * 60 * 24)) + 1
            const pct = c.challengeType === 'spend_limit' 
              ? Math.min(Math.round((c.progress / c.targetValue) * 100), 100)
              : Math.min(Math.round((c.progress / daysLimit) * 100), 100)

            const daysLeft = Math.max(0, Math.ceil((new Date(c.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
            
            // Determine progress bar color
            const barColor = c.status === 'failed' 
              ? 'bg-red-500' 
              : c.status === 'completed' 
              ? 'bg-green-500'
              : c.challengeType === 'spend_limit' && pct > 80 
              ? 'bg-amber-500' 
              : 'bg-teal-500'

            return (
              <div key={c._id} className={challengeStyles.card}>
                <div>
                  <div className={challengeStyles.cardHeader}>
                    <div className="flex-1 min-w-0 mr-2">
                      <h4 className={challengeStyles.cardTitle}>{c.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block mt-1 ${
                        c.status === 'completed' 
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : c.status === 'failed'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    {(c.challengeType === 'daily_save' || c.challengeType === 'category_fast') && c.status === 'active' && (
                      <div className={challengeStyles.streakBadge}>
                        <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600 animate-pulse" />
                        <span>{c.streak} days</span>
                      </div>
                    )}
                  </div>

                  <p className={challengeStyles.cardDesc}>{c.description || 'No description provided.'}</p>

                  {/* Progress bar section */}
                  <div className={challengeStyles.progressContainer}>
                    <div className={challengeStyles.progressBar}>
                      <div className={challengeStyles.progressFill(barColor)} style={{ width: `${pct}%` }} />
                    </div>
                    <div className={challengeStyles.progressText}>
                      {c.challengeType === 'spend_limit' ? (
                        <>
                          <span>₹{c.progress.toLocaleString('en-IN')} spent</span>
                          <span>Limit: ₹{c.targetValue.toLocaleString('en-IN')} ({pct}%)</span>
                        </>
                      ) : (
                        <>
                          <span>{c.progress} / {daysLimit} days met</span>
                          <span>Target: {c.challengeType === 'daily_save' ? `Save ₹${c.targetValue}/day` : `No ${c.categoryLimit}`}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {daysLeft > 0 ? `${daysLeft} days remaining` : 'Ended'}
                  </span>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg border border-gray-100 cursor-pointer transition-all"
                    title="Abandon Challenge"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Badges Showcase Grid */}
      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm mt-8 space-y-4">
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5 uppercase">
          <Award className="w-4.5 h-4.5 text-purple-600" />
          Badge Achievements
        </h3>
        
        <div className={challengeStyles.badgeShowcase}>
          {BADGES_LIST.map(badge => {
            const isEarned = stats.earnedBadgesList.includes(badge.id)
            return (
              <div key={badge.id} className={challengeStyles.badgeCard(isEarned)}>
                <span className="text-3xl filter">{badge.icon}</span>
                <p className={challengeStyles.badgeName}>{badge.name}</p>
                <p className={challengeStyles.badgeDesc}>{badge.desc}</p>
                {isEarned && (
                  <span className="text-[8px] font-bold uppercase tracking-wider text-teal-600 mt-1.5 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Earned
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL: CREATE CHALLENGE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative border border-gray-100"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">Start Savings Challenge</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 text-gray-500 rounded-full cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Challenge Type</label>
                  <select
                    value={challengeType}
                    onChange={(e) => setChallengeType(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                  >
                    <option value="daily_save">Daily Save Milestone (e.g. Save ₹100/day)</option>
                    <option value="category_fast">Category Spending Fast (e.g. No Food Delivery)</option>
                    <option value="spend_limit">Budget Spending Limit (e.g. Spend under ₹10,000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter custom title..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
                  />
                </div>

                {challengeType !== 'category_fast' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      {challengeType === 'daily_save' ? 'Target Savings Amount per day (Rs)' : 'Target Spend Limit (Rs)'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      placeholder="e.g. 100, 5000"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Forbidden Category</label>
                    <select
                      value={categoryLimit}
                      onChange={(e) => setCategoryLimit(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {/* For category_fast, targetValue represents days of fast */}
                    <div className="mt-3">
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Duration Target (Days)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder="e.g. 7"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Saving for PG rent, cutting down fast food..."
                    rows="2"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl text-sm shadow-md disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {submitting ? 'Starting...' : 'Start Challenge'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default ChallengesPage
