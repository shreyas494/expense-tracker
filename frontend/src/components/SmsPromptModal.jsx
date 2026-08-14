import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Tag, FileText, ArrowRight, RefreshCw, User, Calendar, History, PlusCircle, Phone, Contact } from 'lucide-react'
import axios from 'axios'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Other']
const EXPENSE_CATEGORIES = ['Food', 'Housing', 'Transport', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Other']

const SmsPromptModal = ({ transaction, onClose, onSaved }) => {
  // Nature selection: 'income', 'expense', 'borrow', 'lend'
  const [nature, setNature] = useState(() => {
    if (transaction.type === 'income') return 'income'
    return 'expense'
  })

  // Sub-action for Borrow/Lend: 'new' or 'repay'
  const [borrowLendAction, setBorrowLendAction] = useState('new')
  const [activeRecords, setActiveRecords] = useState([])
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [dueDate, setDueDate] = useState('')

  // Bill Splitting State
  const [isSplitBill, setIsSplitBill] = useState(false)
  const [personalShare, setPersonalShare] = useState('')
  const [personalCategory, setPersonalCategory] = useState('Food')
  const [splitFriends, setSplitFriends] = useState([
    { id: 1, name: '', phone: '', share: '' }
  ])

  const [description, setDescription] = useState(transaction.description || "")
  const [phone, setPhone] = useState("")
  const [note, setNote] = useState(transaction.note || "")
  const [utr, setUtr] = useState(transaction.utr || "")
  const [amount, setAmount] = useState(transaction.amount != null ? transaction.amount : "")
  const [category, setCategory] = useState(transaction.category || (transaction.type === 'income' ? 'Salary' : 'Food'))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // Import single contact from native address book
  const handleImportSingleContact = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel']
        const opts = { multiple: false }
        const selected = await navigator.contacts.select(props, opts)
        if (selected && selected.length > 0) {
          const c = selected[0]
          if (c.name && c.name[0]) setDescription(c.name[0])
          if (c.tel && c.tel[0]) setPhone(c.tel[0].replace(/[^\d+]/g, ''))
        }
      } catch (err) {
        console.warn("Contact picker notice:", err)
      }
    } else {
      alert("Native Contact Picker is available on mobile browsers (e.g. Chrome on Android). You can enter the phone number manually.")
    }
  }

  // Import contact for specific friend in split bill
  const handleImportFriendContact = async (friendId) => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel']
        const opts = { multiple: false }
        const selected = await navigator.contacts.select(props, opts)
        if (selected && selected.length > 0) {
          const c = selected[0]
          const cName = c.name && c.name[0] ? c.name[0] : ''
          const cPhone = c.tel && c.tel[0] ? c.tel[0].replace(/[^\d+]/g, '') : ''
          setSplitFriends(prev => prev.map(f => f.id === friendId ? { ...f, name: cName || f.name, phone: cPhone || f.phone } : f))
        }
      } catch (err) {
        console.warn("Contact picker notice:", err)
      }
    } else {
      alert("Native Contact Picker is available on mobile browsers (e.g. Chrome on Android). You can enter the phone number manually.")
    }
  }

  // Auto-calculate equal shares across all friends
  const autoDistributeShares = (friendsList, totalAmt, myShare) => {
    const total = Number(totalAmt) || 0
    const mine = Number(myShare) || 0
    const remaining = Math.max(0, total - mine)
    if (friendsList.length === 0 || remaining <= 0) return friendsList

    const equalShare = (remaining / friendsList.length).toFixed(2)
    return friendsList.map((f) => ({
      ...f,
      share: equalShare
    }))
  }

  // Auto-calculate default half personal share when split bill is toggled
  const handleToggleSplitBill = (checked) => {
    setIsSplitBill(checked)
    if (checked && amount) {
      const total = Number(amount)
      const halfMine = (total / 2).toFixed(2)
      setPersonalShare(halfMine)
      const initialFriends = [{ id: 1, name: '', phone: '', share: (total - Number(halfMine)).toFixed(2) }]
      setSplitFriends(initialFriends)
    }
  }

  const handlePersonalShareChange = (val) => {
    setPersonalShare(val)
    setSplitFriends(prev => autoDistributeShares(prev, amount, val))
  }

  const handleAddFriend = () => {
    const updated = [
      ...splitFriends,
      { id: Date.now(), name: '', phone: '', share: '' }
    ]
    setSplitFriends(autoDistributeShares(updated, amount, personalShare))
  }

  const handleRemoveFriend = (id) => {
    if (splitFriends.length <= 1) return
    const updated = splitFriends.filter(f => f.id !== id)
    setSplitFriends(autoDistributeShares(updated, amount, personalShare))
  }

  const handleFriendChange = (id, field, value) => {
    setSplitFriends(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  // Fetch active Borrow/Lend records when switching to borrow or lend
  useEffect(() => {
    const fetchActiveLedgers = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get(`${API_BASE}/borrow-lend/get`, { headers })
        if (Array.isArray(res.data)) {
          const pendingRecords = res.data.filter(r => r.status !== 'settled')
          setActiveRecords(pendingRecords)
          if (pendingRecords.length > 0) {
            setSelectedRecordId(pendingRecords[0]._id)
          }
        }
      } catch (err) {
        console.error("Error fetching active borrow/lend records:", err)
      }
    }
    fetchActiveLedgers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      if (nature === 'income' || nature === 'expense') {
        // Standard Income/Expense
        await axios.put(
          `${API_BASE}/expense/update-sms-note/${transaction._id}`,
          {
            description: description.trim() || 'Payment Transaction',
            note: note.trim(),
            utr: utr.trim(),
            category,
            type: nature,
            amount: Number(amount) || transaction.amount || 0
          },
          { headers }
        )
      } else if (nature === 'borrow' || nature === 'lend') {
        const totalAmt = Number(amount) || transaction.amount || 0

        if (borrowLendAction === 'new') {
          if (isSplitBill) {
            const pShare = Number(personalShare) || 0
            if (pShare >= totalAmt || pShare < 0) {
              setError(`Personal share must be less than total bill amount (₹${totalAmt})`)
              setIsSaving(false)
              return
            }

            // Validate all friends have names and valid shares
            for (let f of splitFriends) {
              if (!f.name.trim()) {
                setError("Please provide a name for all friends in the split")
                setIsSaving(false)
                return
              }
              if (!Number(f.share) || Number(f.share) <= 0) {
                setError(`Please enter a valid share amount for ${f.name}`)
                setIsSaving(false)
                return
              }
            }

            // 1. Log personal share as Expense
            await axios.post(
              `${API_BASE}/expense/add`,
              {
                description: `${description.trim() || 'Shared Bill'} (My Share)`,
                amount: pShare,
                category: personalCategory,
                date: transaction.createdAt || transaction.date || new Date().toISOString()
              },
              { headers }
            )

            // 2. Log each friend's individual share as Lend/Borrow with phone number
            for (let f of splitFriends) {
              await axios.post(
                `${API_BASE}/borrow-lend/add`,
                {
                  type: nature,
                  person: f.name.trim(),
                  phone: f.phone ? f.phone.trim() : "",
                  amount: Number(f.share),
                  description: note.trim() ? `${note.trim()}${utr ? ` (Ref: ${utr})` : ''}` : (utr ? `Ref: ${utr}` : ''),
                  dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                  date: transaction.createdAt || transaction.date || new Date().toISOString()
                },
                { headers }
              )
            }
          } else {
            // Single contact full amount as Borrow/Lend
            await axios.post(
              `${API_BASE}/borrow-lend/add`,
              {
                type: nature,
                person: description.trim() || 'Contact Person',
                phone: phone.trim(),
                amount: totalAmt,
                description: note.trim() ? `${note.trim()}${utr ? ` (Ref: ${utr})` : ''}` : (utr ? `Ref: ${utr}` : ''),
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                date: transaction.createdAt || transaction.date || new Date().toISOString()
              },
              { headers }
            )
          }
        } else if (borrowLendAction === 'repay') {
          // Apply as Repayment to Existing Record
          if (!selectedRecordId) {
            setError("Please select an active ledger record to apply this repayment")
            setIsSaving(false)
            return
          }
          await axios.post(
            `${API_BASE}/borrow-lend/repay/${selectedRecordId}`,
            {
              amount: totalAmt,
              notes: note.trim() || description.trim() || 'Repayment via scanned receipt/alert',
              date: transaction.createdAt || transaction.date || new Date().toISOString()
            },
            { headers }
          )
        }

        // Clean up the pending note from SMS inbox after converting to ledger
        try {
          await axios.delete(`${API_BASE}/expense/delete-pending-note/${transaction._id}`, { headers })
        } catch (delErr) {
          console.warn("Clean pending note notice:", delErr)
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error("Failed to update transaction:", err)
      setError(err?.response?.data?.message || "Failed to save. Please try again.")
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

  const categories = nature === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

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
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl rounded-3xl p-5 sm:p-6 relative z-10 text-slate-900 dark:text-white custom-scrollbar my-auto"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2.5 rounded-xl ${nature === 'income' || nature === 'borrow' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Classify Scanned Transaction
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Extracted from bank alert, UPI screenshot, or SMS
            </p>
          </div>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount (₹)</span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-extrabold ${nature === 'income' || nature === 'borrow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {nature === 'income' || nature === 'borrow' ? '+' : '-'} ₹
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-28 text-right font-extrabold text-base px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 ${nature === 'income' || nature === 'borrow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
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
              <span className="font-bold text-slate-700 dark:text-slate-300">Raw Text: </span>
              {transaction.description}
            </div>
          )}
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nature Selection Tabs */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Transaction Type
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setNature('expense')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  nature === 'expense'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setNature('income')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  nature === 'income'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setNature('borrow')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  nature === 'borrow'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Borrow
              </button>
              <button
                type="button"
                onClick={() => setNature('lend')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  nature === 'lend'
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Lend
              </button>
            </div>
          </div>

          {/* Sub-Action Selection for Borrow / Lend */}
          {(nature === 'borrow' || nature === 'lend') && (
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-3">
              <label className="block text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                {nature === 'borrow' ? 'Borrowing Action' : 'Lending Action'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBorrowLendAction('new')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    borrowLendAction === 'new'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  New Record
                </button>
                <button
                  type="button"
                  onClick={() => setBorrowLendAction('repay')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                    borrowLendAction === 'repay'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Repay Existing
                </button>
              </div>

              {/* Dropdown if Repay Existing Record is chosen */}
              {borrowLendAction === 'repay' && (
                <div className="pt-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Select Active Ledger Entry to Repay
                  </label>
                  {activeRecords.length === 0 ? (
                    <p className="text-xs text-rose-500 font-semibold italic bg-white dark:bg-slate-900 p-2 rounded-xl border border-rose-500/20">
                      No active pending ledger records found to apply repayment.
                    </p>
                  ) : (
                    <select
                      value={selectedRecordId}
                      onChange={(e) => setSelectedRecordId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      {activeRecords.map(r => (
                        <option key={r._id} value={r._id}>
                          {r.person} — {r.type === 'borrow' ? 'Borrowed' : 'Lent'} ₹{r.amount} (Remaining: ₹{r.remainingAmount})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Bill Split Option for New Entry */}
              {borrowLendAction === 'new' && (
                <div className="pt-2 border-t border-amber-500/20 space-y-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSplitBill}
                      onChange={(e) => handleToggleSplitBill(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-500 focus:ring-teal-500 cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Split Bill (I paid my share + friend's share)
                    </span>
                  </label>

                  {isSplitBill && (
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/30 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">Total Scanned Bill:</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">₹{amount || 0}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            My Personal Share (Expense)
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={personalShare}
                            onChange={(e) => handlePersonalShareChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-slate-50 dark:bg-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Category for My Share
                          </label>
                          <select
                            value={personalCategory}
                            onChange={(e) => setPersonalCategory(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs cursor-pointer"
                          >
                            {EXPENSE_CATEGORIES.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Friends List Header */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                            Friends Splitting Remaining ₹{Math.max(0, (Number(amount || 0) - Number(personalShare || 0))).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={handleAddFriend}
                            className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <PlusCircle className="w-3 h-3" />
                            Add Friend
                          </button>
                        </div>

                        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                          {splitFriends.map((f, idx) => (
                            <div key={f.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    placeholder={`Friend ${idx + 1} Name`}
                                    value={f.name}
                                    onChange={(e) => handleFriendChange(f.id, 'name', e.target.value)}
                                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleImportFriendContact(f.id)}
                                  className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-xl border border-teal-500/20 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                                  title="Import Contact from Phone Address Book"
                                >
                                  <Contact className="w-3.5 h-3.5" />
                                  Import
                                </button>
                                {splitFriends.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFriend(f.id)}
                                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer shrink-0"
                                    title="Remove Friend"
                                  >
                                    &times;
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                  <input
                                    type="tel"
                                    placeholder="WhatsApp / Phone No"
                                    value={f.phone || ''}
                                    onChange={(e) => handleFriendChange(f.id, 'phone', e.target.value)}
                                    className="w-full pl-7 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                                  />
                                </div>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={f.share}
                                    onChange={(e) => handleFriendChange(f.id, 'share', e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contact / Merchant Field */}
          {(nature === 'income' || nature === 'expense' || borrowLendAction === 'new') && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    {nature === 'borrow' || nature === 'lend' ? <User className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    {nature === 'borrow' || nature === 'lend' ? 'Contact Person Name' : 'Merchant / Recipient'}
                  </span>
                  {(nature === 'borrow' || nature === 'lend') && (
                    <button
                      type="button"
                      onClick={handleImportSingleContact}
                      className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Contact className="w-3 h-3" />
                      Import Contact
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder={nature === 'borrow' || nature === 'lend' ? 'e.g. Rahul, Amit' : 'e.g. Swiggy, Uber'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all"
                />
              </div>

              {(nature === 'borrow' || nature === 'lend') && borrowLendAction === 'new' && !isSplitBill && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    Phone / WhatsApp Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* Category Selector for Income / Expense */}
          {(nature === 'income' || nature === 'expense') && (
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
          )}

          {/* Due Date for New Borrow / Lend Entry */}
          {(nature === 'borrow' || nature === 'lend') && borrowLendAction === 'new' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all"
              />
            </div>
          )}

          {/* Note / Remarks Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Note / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Shared dinner bill, PG rent advance"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all"
            />
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

