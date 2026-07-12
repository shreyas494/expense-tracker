import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, FileSpreadsheet, Download, Calendar, ArrowUpRight, ArrowDownRight, PiggyBank, RefreshCw, CheckCircle, Smartphone, Copy, Share2 } from 'lucide-react'
import axios from 'axios'

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`

const ReportsPage = () => {
  const { transactions, onLogout, user } = useOutletContext()
  const [copied, setCopied] = useState(false)

  const [timeframe, setTimeframe] = useState("monthly")
  const [format, setFormat] = useState("pdf")
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return timeframe === "monthly" 
      ? today.toISOString().substring(0, 7) // YYYY-MM
      : today.toISOString().substring(0, 10) // YYYY-MM-DD
  })
  
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [borrowLendSummary, setBorrowLendSummary] = useState({ totalBorrowed: 0, totalLent: 0 })

  const webhookUrl = useMemo(() => {
    if (!user) return ""
    const apiBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}`
    const base = apiBase.endsWith('/api') ? apiBase : `${apiBase}/api`
    return `${base}/expense/sms-webhook?userId=${user.id || user._id}`
  }, [user])


  // Synchronize date format when timeframe changes
  useEffect(() => {
    const today = new Date()
    if (timeframe === "monthly") {
      setSelectedDate(today.toISOString().substring(0, 7))
    } else {
      setSelectedDate(today.toISOString().substring(0, 10))
    }
  }, [timeframe])

  // Fetch outstanding borrow/lend info
  useEffect(() => {
    const fetchBorrowLend = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get(`${API_BASE}/borrow-lend/overview`, { headers })
        if (res.data.success) {
          setBorrowLendSummary(res.data.data)
        }
      } catch (err) {
        console.error("Failed to load borrow-lend overview on reports page:", err)
        if (err?.response?.status === 401 && onLogout) {
          onLogout()
        }
      }
    }
    fetchBorrowLend()
  }, [])

  // Calculate local statistics for selected range to display preview
  const previewMetrics = useMemo(() => {
    let income = 0
    let expenses = 0
    let rangeTransactions = []

    const targetDate = new Date(selectedDate)
    if (isNaN(targetDate.getTime())) {
      return { income, expenses, savings: 0, rangeTransactions }
    }

    let start, end
    if (timeframe === "daily") {
      start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0)
      end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)
    } else if (timeframe === "weekly") {
      const day = targetDate.getDay()
      start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - day, 0, 0, 0, 0)
      end = new Date(start.getTime())
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      // Monthly
      start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0, 0)
      end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    transactions.forEach(t => {
      const tDate = new Date(t.date)
      if (tDate >= start && tDate <= end) {
        rangeTransactions.push(t)
        const amt = Number(t.amount || 0)
        if (t.type === "income") income += amt
        else expenses += amt
      }
    })

    const savings = income - expenses
    return { income, expenses, savings, rangeTransactions }
  }, [transactions, timeframe, selectedDate])

  const handleDownload = async () => {
    setIsExporting(true)
    setExportSuccess(false)

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await axios.get(`${API_BASE}/reports/export`, {
        params: {
          timeframe,
          format,
          date: selectedDate
        },
        headers,
        responseType: 'blob'
      })

      // Create blob download link
      const blob = new Blob([response.data], { 
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          : 'application/pdf' 
      })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      
      const fileExtension = format === 'excel' ? 'xlsx' : 'pdf'
      link.setAttribute('download', `TrackExpense_${timeframe}_Report_${selectedDate}.${fileExtension}`)
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 4000)
    } catch (err) {
      console.error("Report download failed:", err)
      alert("Failed to export report. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareText = async () => {
    try {
      const dateObj = new Date(selectedDate)
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      
      const dateFormatted = isNaN(dateObj.getTime())
        ? selectedDate
        : timeframe === 'daily'
          ? dateObj.toLocaleDateString('en-IN', options)
          : timeframe === 'monthly'
            ? dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
            : `Week of ${dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`

      const title = `Financial ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Summary`
      
      // Separate income and expense transactions
      const incomeList = []
      const expenseList = []
      
      if (previewMetrics.rangeTransactions) {
        previewMetrics.rangeTransactions.forEach(t => {
          const noteText = (t.description && t.description.trim())
            ? t.description
            : t.category
              ? t.category
              : (t.type === 'income' ? 'Income' : 'Expense')
              
          const line = `• ₹${Number(t.amount || 0).toFixed(2)} - ${noteText}`
          
          if (t.type === 'income') {
            incomeList.push(line)
          } else {
            expenseList.push(line)
          }
        })
      }

      // Construct the formatted WhatsApp-compatible text
      let shareText = `📊 *${title}*
📅 *Period*: ${dateFormatted}
==================================\n\n`

      if (incomeList.length > 0) {
        shareText += `📝 *Income Transactions:*\n`
        shareText += incomeList.join('\n') + `\n`
        shareText += `----------------------------------
💰 *Total Income*: ₹${previewMetrics.income.toFixed(2)}\n\n`
      }

      if (expenseList.length > 0) {
        shareText += `📝 *Expense Transactions:*\n`
        shareText += expenseList.join('\n') + `\n`
        shareText += `----------------------------------
💸 *Total Expenses*: ₹${previewMetrics.expenses.toFixed(2)}\n\n`
      }

      if (incomeList.length === 0 && expenseList.length === 0) {
        shareText += `📝 *No transactions recorded for this period.*\n\n`
      }

      shareText += `==================================
⚖️ *Remaining Balance*: ₹${previewMetrics.savings.toFixed(2)}`

      if (navigator.share) {
        await navigator.share({
          title: title,
          text: shareText
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert("Summary copied to clipboard! Paste it into WhatsApp or messages to share.")
      }
    } catch (err) {
      console.error("Failed to share/copy summary:", err)
    }
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 max-w-4xl mx-auto space-y-8 min-h-screen text-gray-800 dark:text-gray-100 font-sans"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">
            Financial Reports
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Export well-formatted statements of your financial balances, incomes, expenses, debts, and savings challenges.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Report Controls */}
        <div className="md:col-span-2 space-y-6">
          {/* Timeframe Selector Card */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-teal-600" />
              1. Choose Report Timeframe
            </h2>
            <div className="flex gap-2 p-1 bg-gray-50 dark:bg-slate-800 rounded-xl mb-4">
              {["daily", "weekly", "monthly"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                    timeframe === t
                      ? "bg-white dark:bg-slate-955 text-teal-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Select Date / Month
              </label>
              <input
                type={timeframe === "monthly" ? "month" : "date"}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Format Selector Card */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-teal-600" />
              2. Select Export Format
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PDF Selector */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFormat("pdf")}
                onKeyDown={(e) => e.key === 'Enter' && setFormat("pdf")}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  format === "pdf"
                    ? "border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 ring-2 ring-teal-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`p-3 rounded-lg ${format === "pdf" ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">PDF Document</h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">Perfect for print-outs, statements, and visual summaries.</p>
                </div>
              </div>

              {/* Excel Selector */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFormat("excel")}
                onKeyDown={(e) => e.key === 'Enter' && setFormat("excel")}
                className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  format === "excel"
                    ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 ring-2 ring-emerald-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`p-3 rounded-lg ${format === "excel" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Excel Spreadsheet</h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">Multi-sheet workbook. Best for data sorting and formulas.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Automate SMS Tracking Card */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-teal-600" />
              3. Automate Phone UPI / PhonePe Tracking
            </h2>
            <p className="text-sm text-gray-500 mb-4 font-medium">
              Copy your personal webhook URL and use it in your phone's SMS Forwarder app to automatically capture and log transactions.
            </p>

            <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-xl mb-4">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Your Webhook URL</span>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={user ? webhookUrl : "Loading..."}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (user) {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }
                  }}
                  className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 font-medium space-y-2">
              <p className="font-bold text-gray-700 dark:text-gray-300">Quick Configuration:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Open the **SMS Forwarder** app on your phone.</li>
                <li>Add a forwarding rule with triggers set to incoming bank SMS (e.g. from HDFC, SBI, AXIS).</li>
                <li>Set target to **Webhook (HTTP POST)** and paste your Webhook URL above.</li>
              </ol>
            </div>
          </div>
        </div>


        {/* Right Column: Statement Preview & Trigger */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 shadow-md border border-gray-100 dark:border-gray-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full min-h-[380px]">
            {/* Header background accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-800 mb-1">
                Statement Preview
              </h2>
              <p className="text-xs text-gray-500 mb-6 font-semibold">
                Calculated statistics for {selectedDate || "selected date"}
              </p>

              {/* Visual Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-600">Total Income</span>
                  </div>
                  <span className="font-bold text-teal-600">
                    ₹{previewMetrics.income.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-600">Total Expenses</span>
                  </div>
                  <span className="font-bold text-orange-600">
                    ₹{previewMetrics.expenses.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800/50 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600">
                      <PiggyBank className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-600">Net Savings</span>
                  </div>
                  <span className={`font-bold ${previewMetrics.savings >= 0 ? "text-teal-600" : "text-orange-600"}`}>
                    ₹{previewMetrics.savings.toFixed(2)}
                  </span>
                </div>

                {/* Additional context */}
                <div className="mt-4 pt-2 space-y-2">
                  <div className="flex justify-between text-xs text-gray-505 font-semibold">
                    <span>Outstanding Loans (Lent):</span>
                    <span className="font-bold text-gray-700">₹{borrowLendSummary.totalLent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-550 font-semibold">
                    <span>Outstanding Debts (Borrowed):</span>
                    <span className="font-bold text-gray-700">₹{borrowLendSummary.totalBorrowed.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trigger Button and feedback */}
            <div className="mt-8 space-y-3">
              <AnimatePresence mode="wait">
                {exportSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-sm text-green-600 font-bold justify-center bg-green-500/5 py-2 rounded-xl"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Report downloaded successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                disabled={isExporting}
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 active:scale-[0.98] disabled:opacity-75 disabled:scale-100 transition-all shadow-md shadow-teal-500/10 cursor-pointer disabled:cursor-not-allowed text-base"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Export to {format.toUpperCase()}
                  </>
                )}
              </button>

              <button
                onClick={handleShareText}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-800 font-bold hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer text-base border border-gray-200/30 dark:border-slate-800"
              >
                <Share2 className="w-5 h-5 text-teal-600" />
                Share Text Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default ReportsPage
