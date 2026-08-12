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

  const currentNetBalance = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
    return income - expenses
  }, [transactions])

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

      // Calculations for formula formatting
      const totalIncomeToday = previewMetrics.income
      const totalExpensesToday = previewMetrics.expenses
      const finalBalance = currentNetBalance
      const previousBalance = finalBalance - (totalIncomeToday - totalExpensesToday)

      // Construct the formatted WhatsApp-compatible text
      let shareText = `📊 *${title}*
📅 *Period*: ${dateFormatted}
==================================\n\n`

      if (incomeList.length > 0) {
        shareText += `📝 *Income Transactions:*\n`
        shareText += incomeList.join('\n') + `\n`
        shareText += `----------------------------------
💰 *Total Income*: ₹${totalIncomeToday.toFixed(2)}

`
        // Show remaining balance addition calculation
        const incomeResultBal = previousBalance + totalIncomeToday
        shareText += `⚖️ *Remaining Balance*: ₹${previousBalance.toFixed(2)} + ₹${totalIncomeToday.toFixed(2)} = ₹${incomeResultBal.toFixed(2)}\n\n`
      }

      if (expenseList.length > 0) {
        shareText += `📝 *Expense Transactions:*\n`
        shareText += expenseList.join('\n') + `\n`
        shareText += `----------------------------------
💸 *Total Expenses*: ₹${totalExpensesToday.toFixed(2)}

`
        // Show remaining balance subtraction calculation
        const baseBal = incomeList.length > 0 ? (previousBalance + totalIncomeToday) : previousBalance
        const expenseResultBal = baseBal - totalExpensesToday
        shareText += `⚖️ *Remaining Balance*: ₹${baseBal.toFixed(2)} - ₹${totalExpensesToday.toFixed(2)} = ₹${expenseResultBal.toFixed(2)}\n\n`
      }

      if (incomeList.length === 0 && expenseList.length === 0) {
        shareText += `📝 *No transactions recorded for this period.*\n\n`
        shareText += `⚖️ *Remaining Balance*: ₹${finalBalance.toFixed(2)}\n\n`
      }

      shareText += `==================================`

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
      className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Reports & Export
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs md:text-sm font-medium">
            Export well-formatted statements of your financial balances, incomes, expenses, debts, and savings challenges.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeframe Selector Card */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-teal-500" />
              1. Choose Report Timeframe
            </h2>
            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4">
              {["daily", "weekly", "monthly"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all capitalize cursor-pointer ${
                    timeframe === t
                      ? "bg-teal-500 text-slate-950 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Select Date / Month
              </label>
              <input
                type={timeframe === "monthly" ? "month" : "date"}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold text-xs transition-all"
              />
            </div>
          </div>

          {/* Format Selector Card */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-teal-500" />
              2. Select Export Format
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PDF Selector */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFormat("pdf")}
                onKeyDown={(e) => e.key === 'Enter' && setFormat("pdf")}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  format === "pdf"
                    ? "border-teal-500 bg-teal-500/10 ring-2 ring-teal-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "pdf" ? "bg-teal-500 text-slate-950" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">PDF Document</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Perfect for print-outs, statements, and visual summaries.</p>
                </div>
              </div>

              {/* Excel Selector */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFormat("excel")}
                onKeyDown={(e) => e.key === 'Enter' && setFormat("excel")}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  format === "excel"
                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className={`p-3 rounded-xl ${format === "excel" ? "bg-emerald-500 text-slate-950" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">Excel Spreadsheet</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Multi-sheet workbook. Best for data sorting and formulas.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Automate SMS Tracking Card */}
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Smartphone className="w-5 h-5 text-teal-500" />
              3. Automate Phone UPI / PhonePe Tracking
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium">
              Copy your personal webhook URL and use it in your phone's SMS Forwarder app to automatically capture and log transactions.
            </p>

            <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 rounded-xl mb-4">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Webhook URL</span>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={user ? webhookUrl : "Loading..."}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (user) {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 3000);
                    }
                  }}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl font-extrabold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium space-y-2">
              <p className="font-bold text-slate-700 dark:text-slate-300">Quick Configuration:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Open the SMS Forwarder app on your mobile phone.</li>
                <li>Add a forwarding rule with triggers set to incoming bank SMS (e.g. HDFC, SBI, AXIS, GPay).</li>
                <li>Set target to Webhook (HTTP POST) and paste your Webhook URL above.</li>
              </ol>
            </div>
          </div>
        </div>


        {/* Right Column: Statement Preview & Trigger */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between h-full min-h-[380px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                Statement Preview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
                Calculated statistics for {selectedDate || "selected date"}
              </p>

              {/* Visual Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Income</span>
                  </div>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                    ₹{previewMetrics.income.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Total Expenses</span>
                  </div>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs">
                    ₹{previewMetrics.expenses.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      <PiggyBank className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Net Savings</span>
                  </div>
                  <span className={`font-extrabold text-xs ${previewMetrics.savings >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    ₹{previewMetrics.savings.toFixed(2)}
                  </span>
                </div>

                {/* Additional context */}
                <div className="mt-4 pt-2 space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Outstanding Loans (Lent):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{borrowLendSummary.totalLent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>Outstanding Debts (Borrowed):</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">₹{borrowLendSummary.totalBorrowed.toFixed(2)}</span>
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
                    className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold justify-center bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/20"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Report downloaded successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                disabled={isExporting}
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export to {format.toUpperCase()}
                  </>
                )}
              </button>

              <button
                onClick={handleShareText}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <Share2 className="w-4 h-4 text-teal-500" />
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
