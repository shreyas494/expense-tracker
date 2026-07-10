import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Tag, FileText, ArrowRight, RefreshCw } from 'lucide-react'
import axios from 'axios'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Housing', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Other']

const SmsPromptModal = ({ transaction, onClose, onSaved }) => {
  const [description, setDescription] = useState(transaction.description || "")
  const [category, setCategory] = useState(transaction.type === 'income' ? 'Salary' : 'Food')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      await axios.put(
        `${API_BASE}/expense/update-sms-note/${transaction._id}`,
        {
          description,
          category,
          type: transaction.type
        },
        { headers }
      )

      onSaved()
      onClose()
    } catch (err) {
      console.error("Failed to update SMS note:", err)
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const categories = transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-2xl rounded-3xl p-6 relative overflow-hidden z-10 text-gray-800 dark:text-gray-100"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${transaction.type === 'income' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              New Transaction Detected!
            </h3>
            <p className="text-xs text-gray-500 font-semibold">
              Automatically logged from your phone's SMS.
            </p>
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 mb-6 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Amount</span>
            <span className={`text-xl font-extrabold ${transaction.type === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-orange-600 dark:text-orange-400'}`}>
              {transaction.type === 'income' ? '+' : '-'} ₹{Number(transaction.amount).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-gray-500">
            <span>Date logged:</span>
            <span className="text-gray-700 dark:text-gray-300">
              {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="text-xs font-semibold text-gray-500">
            <span>Raw text:</span>
            <p className="mt-1 text-gray-600 dark:text-gray-300 italic bg-gray-100 dark:bg-slate-800 p-2 rounded-lg font-mono text-[10px] break-all leading-normal">
              {transaction.description}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Add description Note
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Swiggy food delivery, Salary bonus"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-semibold"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-semibold cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-bold bg-red-500/5 p-2 rounded-lg text-center border border-red-500/10">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 dark:border-gray-800 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Save Details
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default SmsPromptModal
