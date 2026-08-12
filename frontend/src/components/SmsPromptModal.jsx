import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Tag, FileText, ArrowRight, RefreshCw } from 'lucide-react'
import axios from 'axios'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Housing', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Other']

const SmsPromptModal = ({ transaction, onClose, onSaved }) => {
  const [description, setDescription] = useState(transaction.description || "")
  const [note, setNote] = useState(transaction.note || "")
  const [utr, setUtr] = useState(transaction.utr || "")
  const [amount, setAmount] = useState(transaction.amount != null ? transaction.amount : "")
  const [category, setCategory] = useState(transaction.category || (transaction.type === 'income' ? 'Salary' : 'Food'))
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
          description: description.trim() || 'Payment Transaction',
          note: note.trim(),
          utr: utr.trim(),
          category,
          type: transaction.type,
          amount: Number(amount) || transaction.amount || 0
        },
        { headers }
      )

      onSaved()
      onClose()
    } catch (err) {
      console.error("Failed to update transaction note:", err)
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = async () => {
    setIsSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      await axios.put(
        `${API_BASE}/expense/update-sms-note/${transaction._id}`,
        {
          description: transaction.description || 'Payment Transaction',
          note: transaction.note || '',
          utr: transaction.utr || '',
          category: transaction.category || 'Other',
          type: transaction.type,
          amount: transaction.amount || 0
        },
        { headers }
      )

      onSaved()
      onClose()
    } catch (err) {
      console.error("Failed to skip SMS note:", err)
      onClose()
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
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl p-6 relative overflow-hidden z-10 text-slate-900 dark:text-white"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Shared Transaction Detected
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Extracted from shared alert or bank SMS
            </p>
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount (₹)</span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-extrabold ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {transaction.type === 'income' ? '+' : '-'} ₹
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-28 text-right font-extrabold text-base px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span>Date logged:</span>
            <span className="text-slate-700 dark:text-slate-300">
              {new Date(transaction.createdAt || transaction.date || Date.now()).toLocaleString()}
            </span>
          </div>
          {transaction.utr && (
            <div className="flex justify-between text-[10px] font-mono font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-1 rounded-lg">
              <span>UTR / Ref No:</span>
              <span>{transaction.utr}</span>
            </div>
          )}
          {transaction.description && (
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg break-all leading-relaxed">
              <span className="font-bold text-slate-700 dark:text-slate-300">Extracted Text: </span>
              {transaction.description}
            </div>
          )}
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Merchant / Recipient
              </span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Uddesh Bhagyawant PICT"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Note / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner with friends (leave blank if none)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-xs text-rose-500 font-bold bg-rose-500/10 p-2.5 rounded-xl text-center border border-rose-500/20">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSkip}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs cursor-pointer disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-extrabold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
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
