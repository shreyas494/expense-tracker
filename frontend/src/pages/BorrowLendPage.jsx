import React, { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { 
  Plus, Search, Calendar, Edit2, Trash2, HandCoins, 
  PiggyBank, AlertCircle, CheckCircle2, User, Clock, 
  ArrowUpRight, ArrowDownRight, Send, History, IndianRupee,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { borrowLendStyles, cn } from '../assets/dummyStyles'

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/borrow-lend`

const BorrowLendPage = () => {
  const { onLogout, refreshTransactions } = useOutletContext()
  const [activeTab, setActiveTab] = useState('borrow') // 'borrow' or 'lend'
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // 'all', 'active', 'settled'
  
  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  
  // Record Form state
  const [recordId, setRecordId] = useState(null)
  const [formType, setFormType] = useState('borrow')
  const [person, setPerson] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0])
  const [submittingRecord, setSubmittingRecord] = useState(false)
  const [recordError, setRecordError] = useState('')

  // Repayment Form state
  const [repayAmount, setRepayAmount] = useState('')
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split('T')[0])
  const [repayNotes, setRepayNotes] = useState('')
  const [submittingRepay, setSubmittingRepay] = useState(false)
  const [repayError, setRepayError] = useState('')
  
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

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${BASE_URL}/get`, { headers: getHeaders() })
      setRecords(res.data)
    } catch (err) {
      console.error('Error fetching borrow-lend records:', err)
      triggerToast('Failed to fetch records', 'error')
      if (err?.response?.status === 401 && onLogout) {
        onLogout()
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // Stats computation
  const stats = useMemo(() => {
    const now = new Date()
    let borrowed = 0
    let lent = 0
    let overdueBorrowed = 0
    let overdueLent = 0
    let pendingBorrowed = 0
    let pendingLent = 0

    records.forEach(r => {
      if (r.status !== 'settled') {
        const isOverdue = r.dueDate && new Date(r.dueDate) < now
        if (r.type === 'borrow') {
          borrowed += r.remainingAmount
          pendingBorrowed++
          if (isOverdue) overdueBorrowed += r.remainingAmount
        } else {
          lent += r.remainingAmount
          pendingLent++
          if (isOverdue) overdueLent += r.remainingAmount
        }
      }
    })

    return {
      totalBorrowed: borrowed,
      totalLent: lent,
      overdueBorrowed,
      overdueLent,
      pendingBorrowed,
      pendingLent
    }
  }, [records])

  // Filtered and searched records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Filter by tab
      if (r.type !== activeTab) return false
      
      // Filter by status
      if (statusFilter === 'active' && r.status === 'settled') return false
      if (statusFilter === 'settled' && r.status !== 'settled') return false
      
      // Filter by search query
      const matchQuery = 
        r.person.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchQuery
    })
  }, [records, activeTab, statusFilter, searchQuery])

  // Open Add Modal
  const openAddModal = () => {
    setRecordId(null)
    setFormType(activeTab)
    setPerson('')
    setAmount('')
    setDescription('')
    setDueDate('')
    setRecordDate(new Date().toISOString().split('T')[0])
    setRecordError('')
    setIsRecordModalOpen(true)
  }

  // Open Edit Modal
  const openEditModal = (rec) => {
    setRecordId(rec._id)
    setFormType(rec.type)
    setPerson(rec.person)
    setAmount(rec.amount)
    setDescription(rec.description || '')
    setDueDate(rec.dueDate ? rec.dueDate.split('T')[0] : '')
    setRecordDate(rec.date ? rec.date.split('T')[0] : new Date().toISOString().split('T')[0])
    setRecordError('')
    setIsRecordModalOpen(true)
  }

  // Submit record Add/Edit
  const handleRecordSubmit = async (e) => {
    e.preventDefault()
    setSubmittingRecord(true)
    setRecordError('')

    const payload = {
      type: formType,
      person,
      amount: Number(amount),
      description,
      dueDate: dueDate || undefined,
      date: recordDate
    }

    try {
      if (recordId) {
        await axios.put(`${BASE_URL}/update/${recordId}`, payload, { headers: getHeaders() })
        triggerToast('Record updated successfully')
      } else {
        await axios.post(`${BASE_URL}/add`, payload, { headers: getHeaders() })
        triggerToast('Record added successfully')
      }
      setIsRecordModalOpen(false)
      fetchRecords()
      refreshTransactions?.()
    } catch (err) {
      console.error('Error saving borrow-lend record:', err)
      setRecordError(err.response?.data?.message || 'Failed to save record')
    } finally {
      setSubmittingRecord(false)
    }
  }

  // Delete Record
  const handleDeleteRecord = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record? This will delete all repayment history for it.')) return
    try {
      await axios.delete(`${BASE_URL}/delete/${id}`, { headers: getHeaders() })
      triggerToast('Record deleted successfully')
      fetchRecords()
      refreshTransactions?.()
    } catch (err) {
      console.error('Error deleting record:', err)
      triggerToast('Failed to delete record', 'error')
    }
  }

  // Open Repayments Modal
  const openRepayments = (rec) => {
    setSelectedRecord(rec)
    setRepayAmount('')
    setRepayDate(new Date().toISOString().split('T')[0])
    setRepayNotes('')
    setRepayError('')
    setIsRepaymentModalOpen(true)
  }

  // Add Repayment
  const handleRepaySubmit = async (e) => {
    e.preventDefault()
    setSubmittingRepay(true)
    setRepayError('')

    try {
      const res = await axios.post(
        `${BASE_URL}/repayment/${selectedRecord._id}`, 
        { amount: Number(repayAmount), date: repayDate, notes: repayNotes },
        { headers: getHeaders() }
      )
      
      // Update selected record in modal and records array
      setSelectedRecord(res.data.data)
      setRecords(prev => prev.map(r => r._id === res.data.data._id ? res.data.data : r))
      
      setRepayAmount('')
      setRepayNotes('')
      triggerToast('Repayment recorded successfully')
      refreshTransactions?.()
    } catch (err) {
      console.error('Error adding repayment:', err)
      setRepayError(err.response?.data?.message || 'Failed to add repayment')
    } finally {
      setSubmittingRepay(false)
    }
  }

  // Quick Settle Debt
  const handleQuickSettle = async () => {
    setSubmittingRepay(true)
    setRepayError('')
    try {
      const res = await axios.post(
        `${BASE_URL}/repayment/${selectedRecord._id}`, 
        { 
          amount: selectedRecord.remainingAmount, 
          date: new Date().toISOString().split('T')[0], 
          notes: 'Instant full settlement' 
        },
        { headers: getHeaders() }
      )
      
      setSelectedRecord(res.data.data)
      setRecords(prev => prev.map(r => r._id === res.data.data._id ? res.data.data : r))
      triggerToast('Debt settled fully')
      setIsRepaymentModalOpen(false)
      refreshTransactions?.()
    } catch (err) {
      console.error('Error settling debt:', err)
      triggerToast('Failed to settle debt', 'error')
    } finally {
      setSubmittingRepay(false)
    }
  }

  // Delete Repayment History item
  const handleDeleteRepayment = async (paymentId) => {
    if (!window.confirm('Delete this payment history entry? Balance will revert.')) return
    try {
      const res = await axios.delete(
        `${BASE_URL}/repayment/${selectedRecord._id}/${paymentId}`,
        { headers: getHeaders() }
      )
      setSelectedRecord(res.data.data)
      setRecords(prev => prev.map(r => r._id === res.data.data._id ? res.data.data : r))
      triggerToast('Payment entry deleted')
      refreshTransactions?.()
    } catch (err) {
      console.error('Error deleting payment entry:', err)
      triggerToast('Failed to delete payment', 'error')
    }
  }

  // Remind Contact Text Copy WhatsApp/SMS
  const handleCopyReminder = (rec) => {
    const formattedDate = rec.dueDate ? new Date(rec.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''
    const text = `Hey ${rec.person}, friendly reminder about the outstanding payment of ₹${rec.remainingAmount.toLocaleString('en-IN')}${formattedDate ? ` which was due on ${formattedDate}` : ''}. Let me know when you can clear it. Thanks!`
    
    navigator.clipboard.writeText(text)
    triggerToast('Reminder text copied to clipboard!')
  }

  return (
    <div className={borrowLendStyles.container}>
      
      {/* Toast notifications */}
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

      {/* Header Container */}
      <div className={borrowLendStyles.headerContainer}>
        <div>
          <h1 className={borrowLendStyles.title}>
            <HandCoins className="w-7 h-7 text-teal-500" />
            Borrow & Lend Manager
          </h1>
          <p className={borrowLendStyles.subtitle}>
            Track personal loans, debts, receivables, and log partial repayments.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl text-sm shadow hover:shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Record
        </button>
      </div>

      {/* Tabs */}
      <div className={borrowLendStyles.tabContainer}>
        <button
          onClick={() => { setActiveTab('borrow'); setStatusFilter('active'); }}
          className={borrowLendStyles.tabButton(activeTab === 'borrow')}
        >
          <span className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4" />
            Money I Borrowed ({stats.pendingBorrowed} pending)
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('lend'); setStatusFilter('active'); }}
          className={borrowLendStyles.tabButton(activeTab === 'lend')}
        >
          <span className="flex items-center gap-2">
            <HandCoins className="w-4 h-4" />
            Money I Lent ({stats.pendingLent} pending)
          </span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className={borrowLendStyles.statsGrid}>
        <div className={borrowLendStyles.statCard}>
          <div className="flex-1 min-w-0 mr-2">
            <p className={borrowLendStyles.statTitle}>Outstanding Debt</p>
            <p className={borrowLendStyles.statVal}>₹{stats.totalBorrowed.toLocaleString('en-IN')}</p>
          </div>
          <div className={borrowLendStyles.statIcon('red')}>
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className={borrowLendStyles.statCard}>
          <div className="flex-1 min-w-0 mr-2">
            <p className={borrowLendStyles.statTitle}>Overdue Debt</p>
            <p className="text-2xl font-bold text-red-600 mt-1">₹{stats.overdueBorrowed.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2 rounded-xl bg-red-100 text-red-700 animate-pulse flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className={borrowLendStyles.statCard}>
          <div className="flex-1 min-w-0 mr-2">
            <p className={borrowLendStyles.statTitle}>Outstanding Lent</p>
            <p className={borrowLendStyles.statVal}>₹{stats.totalLent.toLocaleString('en-IN')}</p>
          </div>
          <div className={borrowLendStyles.statIcon('green')}>
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className={borrowLendStyles.statCard}>
          <div className="flex-1 min-w-0 mr-2">
            <p className={borrowLendStyles.statTitle}>Overdue Lent</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">₹{stats.overdueLent.toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2 rounded-xl bg-orange-100 text-orange-700 flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={borrowLendStyles.actionBar}>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search by contact name...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
          {['all', 'active', 'settled'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === f
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'active' ? 'Pending / Partial' : f === 'settled' ? 'Settled Only' : 'All Records'}
            </button>
          ))}
        </div>
      </div>

      {/* Records Listing */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mb-3"></div>
          <p className="text-gray-500 text-sm font-semibold">Loading ledger records...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl p-8">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-600">
            {activeTab === 'borrow' ? <PiggyBank className="w-8 h-8" /> : <HandCoins className="w-8 h-8" />}
          </div>
          <h3 className="text-lg font-bold text-gray-800">No records found</h3>
          <p className="text-gray-500 text-xs mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try modifying your search filter.' : `Log your first entry to track what you've ${activeTab === 'borrow' ? 'borrowed' : 'lent'}.`}
          </p>
        </div>
      ) : (
        <div className={borrowLendStyles.cardList}>
          {filteredRecords.map(rec => {
            const isOverdue = rec.status !== 'settled' && rec.dueDate && new Date(rec.dueDate) < new Date()
            const isDueSoon = rec.status !== 'settled' && rec.dueDate && !isOverdue && (new Date(rec.dueDate) - new Date()) / (1000 * 60 * 60 * 24) <= 3
            
            const daysOverdue = rec.dueDate ? Math.floor((new Date() - new Date(rec.dueDate)) / (1000 * 60 * 60 * 24)) : 0
            
            return (
              <div key={rec._id} className={borrowLendStyles.itemCard}>
                
                {/* Header info */}
                <div className={borrowLendStyles.cardHeader}>
                  <div className="flex-1 min-w-0 mr-2">
                    <h3 className={borrowLendStyles.personName}>{rec.person}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(rec.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </p>
                    {isOverdue && (
                      <span className={borrowLendStyles.overdueBadge}>
                        OVERDUE ({daysOverdue} days)
                      </span>
                    )}
                    {isDueSoon && (
                      <span className={borrowLendStyles.dueSoonBadge}>
                        Due Soon
                      </span>
                    )}
                  </div>
                  <span className={borrowLendStyles.statusBadge(rec.status)}>
                    {rec.status === 'settled' ? 'Settled' : rec.status === 'partially_paid' ? 'Partial' : 'Unpaid'}
                  </span>
                </div>

                {/* Amount Section */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex justify-between items-center my-3">
                  <div>
                    <p className={borrowLendStyles.amountLabel}>Total Amount</p>
                    <p className={borrowLendStyles.amountVal}>₹{rec.amount.toLocaleString('en-IN')}</p>
                  </div>
                  {rec.status !== 'settled' && (
                    <div className="text-right">
                      <p className={borrowLendStyles.amountLabel}>Outstanding</p>
                      <p className={borrowLendStyles.remainingVal}>₹{rec.remainingAmount.toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className={borrowLendStyles.description}>
                  {rec.description || <span className="text-gray-300 italic text-xs">No description provided</span>}
                </p>

                {/* Meta / Due Date */}
                <div className={borrowLendStyles.metaInfo}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {rec.dueDate ? (
                      <>Due: <span className="font-semibold">{new Date(rec.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span></>
                    ) : (
                      <span className="italic text-gray-400">No due date</span>
                    )}
                  </span>
                </div>

                {/* Card Actions */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100 justify-end">
                  <button
                    onClick={() => openEditModal(rec)}
                    className="p-2 bg-gray-50 hover:bg-teal-50 text-gray-500 hover:text-teal-600 rounded-lg transition-colors cursor-pointer border border-gray-100"
                    title="Edit Record Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRecord(rec._id)}
                    className="p-2 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer border border-gray-100"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {activeTab === 'lend' && rec.status !== 'settled' && (
                    <button
                      onClick={() => handleCopyReminder(rec)}
                      className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg transition-all cursor-pointer border border-teal-100"
                      title="Copy Payment Reminder Text"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => openRepayments(rec)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow active:scale-[0.98] transition-all cursor-pointer ml-auto"
                  >
                    <History className="w-3.5 h-3.5" />
                    {rec.status === 'settled' ? 'Payment Logs' : 'Repayments'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* RECORD ADD/EDIT MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">
                  {recordId ? 'Edit Ledger Entry' : 'New Ledger Entry'}
                </h3>
                <button 
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1 hover:bg-gray-100 text-gray-500 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {recordError && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-150 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{recordError}</span>
                </div>
              )}

              <form onSubmit={handleRecordSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Entry Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType('borrow')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        formType === 'borrow'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Money I Borrowed
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('lend')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        formType === 'lend'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Money I Lent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Contact Person</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={person}
                      onChange={(e) => setPerson(e.target.value)}
                      placeholder="Enter contact name..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Amount (Rs)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Record Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Due Date (Optional)</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. For dinner, office loan..."
                    rows="2"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                  />
                </div>

                <div className="flex gap-2 pt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRecord}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl text-sm shadow-md disabled:opacity-50 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    {submittingRecord ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPAYMENTS HISTORY & FORM MODAL */}
      <AnimatePresence>
        {isRepaymentModalOpen && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-gray-100 relative"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Repayment Ledger: {selectedRecord.person}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Outstanding Balance: <span className="font-semibold text-teal-600">₹{selectedRecord.remainingAmount.toLocaleString('en-IN')}</span> / ₹{selectedRecord.amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button 
                  onClick={() => setIsRepaymentModalOpen(false)}
                  className="p-1 hover:bg-gray-100 text-gray-500 rounded-full cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Two Column Layout: Payment History & New Entry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                
                {/* Column 1: Repayments History */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Payment History
                  </h4>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {selectedRecord.payments.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-4">No payments recorded yet.</p>
                    ) : (
                      selectedRecord.payments.map((p) => (
                        <div key={p._id} className={borrowLendStyles.repaymentItem}>
                          <div>
                            <span className="font-bold text-gray-700">₹{p.amount.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-400 block">
                              {new Date(p.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                            </span>
                            {p.notes && <span className={borrowLendStyles.repaymentNotes}>{p.notes}</span>}
                          </div>
                          {selectedRecord.status !== 'settled' && (
                            <button
                              onClick={() => handleDeleteRepayment(p._id)}
                              className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                              title="Delete repayment entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Column 2: New Payment Form */}
                <div className="border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
                  {selectedRecord.status === 'settled' ? (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center flex flex-col items-center justify-center h-full">
                      <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                      <p className="text-sm font-bold text-green-800">Fully Settled</p>
                      <p className="text-[11px] text-green-600 mt-1">This ledger is completed and no outstanding balance remains.</p>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                        Log Payment
                      </h4>
                      {repayError && (
                        <div className="mb-3 p-2.5 bg-red-50 border border-red-150 text-red-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{repayError}</span>
                        </div>
                      )}
                      <form onSubmit={handleRepaySubmit} className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Amount (Rs)</label>
                          <div className="relative">
                            <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="number"
                              required
                              min="1"
                              max={selectedRecord.remainingAmount}
                              value={repayAmount}
                              onChange={(e) => setRepayAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Payment Date</label>
                          <input
                            type="date"
                            required
                            value={repayDate}
                            onChange={(e) => setRepayDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Notes (Optional)</label>
                          <input
                            type="text"
                            value={repayNotes}
                            onChange={(e) => setRepayNotes(e.target.value)}
                            placeholder="Installment payment..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                          />
                        </div>

                        <div className="flex gap-1.5 pt-3">
                          <button
                            type="button"
                            onClick={handleQuickSettle}
                            className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                          >
                            Quick Settle
                          </button>
                          <button
                            type="submit"
                            disabled={submittingRepay}
                            className="w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-lg text-xs shadow-sm disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                          >
                            {submittingRepay ? 'Saving...' : 'Add Repay'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

// Custom Close Icon wrapper since lucide X was not imported separately
const X = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

export default BorrowLendPage
