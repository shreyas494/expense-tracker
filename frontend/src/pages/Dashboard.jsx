import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Percent, Calendar, Wallet } from 'lucide-react'
import axios from 'axios'

const Dashboard = () => {
  const { transactions, allTransactions, timeFrame, setTimeFrame, onLogout } = useOutletContext()
  const [hoveredBar, setHoveredBar] = useState(null)
  const [borrowLendOverview, setBorrowLendOverview] = useState({ totalBorrowed: 0, totalLent: 0 })

  useEffect(() => {
    const fetchBorrowLendOverview = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/borrow-lend/overview`, { headers })
        if (res.data.success) {
          setBorrowLendOverview(res.data.data)
        }
      } catch (err) {
        console.error("Failed to load borrow-lend overview on dashboard:", err)
        if (err?.response?.status === 401 && onLogout) {
          onLogout()
        }
      }
    }
    fetchBorrowLendOverview()
  }, [])

  // 1. Calculate stats: All-Time Total Balance + Period-Specific Metrics
  const metrics = useMemo(() => {
    let allIncome = 0
    let allExpenses = 0
    ;(allTransactions || transactions).forEach(t => {
      const amt = Number(t.amount || 0)
      if (t.type === 'income') allIncome += amt
      else allExpenses += amt
    })

    let periodIncome = 0
    let periodExpenses = 0
    transactions.forEach(t => {
      const amt = Number(t.amount || 0)
      if (t.type === 'income') periodIncome += amt
      else periodExpenses += amt
    })

    const totalBalance = allIncome - allExpenses
    const periodSavings = periodIncome - periodExpenses
    const savingsRate = periodIncome > 0 ? Math.max(0, Math.round((periodSavings / periodIncome) * 100)) : 0

    return {
      totalBalance,
      income: periodIncome,
      expenses: periodExpenses,
      savingsRate
    }
  }, [transactions, allTransactions])

  // 2. Prepare chart data by grouping transactions by day/date
  const chartData = useMemo(() => {
    const groups = {}
    const now = new Date()

    if (timeFrame === 'daily') {
      // Group by hours (today)
      for (let i = 0; i < 24; i += 4) {
        const label = `${i}:00`
        groups[label] = { label, income: 0, expenses: 0 }
      }
      transactions.forEach(t => {
        const hour = new Date(t.date).getHours()
        const bucket = `${Math.floor(hour / 4) * 4}:00`
        if (groups[bucket]) {
          if (t.type === 'income') groups[bucket].income += Number(t.amount)
          else groups[bucket].expenses += Number(t.amount)
        }
      })
    } else if (timeFrame === 'weekly') {
      // Group by day of week
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      days.forEach(day => {
        groups[day] = { label: day, income: 0, expenses: 0 }
      })
      transactions.forEach(t => {
        const dayName = days[new Date(t.date).getDay()]
        if (groups[dayName]) {
          if (t.type === 'income') groups[dayName].income += Number(t.amount)
          else groups[dayName].expenses += Number(t.amount)
        }
      })
    } else {
      // Group by week of the month (default monthly)
      for (let i = 1; i <= 4; i++) {
        const label = `Week ${i}`
        groups[label] = { label, income: 0, expenses: 0 }
      }
      transactions.forEach(t => {
        const dateObj = new Date(t.date)
        const dayOfMonth = dateObj.getDate()
        const weekNum = Math.min(Math.ceil(dayOfMonth / 7), 4)
        const bucket = `Week ${weekNum}`
        if (groups[bucket]) {
          if (t.type === 'income') groups[bucket].income += Number(t.amount)
          else groups[bucket].expenses += Number(t.amount)
        }
      })
    }

    return Object.values(groups)
  }, [transactions, timeFrame])

  // Get max value for scaling the SVG chart bars
  const maxChartVal = useMemo(() => {
    const vals = chartData.flatMap(d => [d.income, d.expenses])
    const max = Math.max(...vals, 100) // Default to at least 100 for scale
    return max * 1.15 // Add 15% head room
  }, [chartData])

  return (
    <div className="space-y-6">
      {/* Time Frame Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          <Calendar className="w-4 h-4 text-teal-500" />
          <span>Filter Period</span>
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto">
          {['daily', 'weekly', 'monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-extrabold transition-all capitalize cursor-pointer ${
                timeFrame === tf
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tf === 'daily' ? 'Today' : tf === 'weekly' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Stats Grid: 2 columns on Mobile, 4 columns on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Box 1: Total Balance */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Balance</span>
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            ₹{metrics.totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Box 2: Monthly Income */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Income</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            ₹{metrics.income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Box 3: Monthly Expense */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Expense</span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            ₹{metrics.expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Box 4: Savings Rate */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Savings Rate</span>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            {metrics.savingsRate}%
          </p>
        </div>
      </div>

      {/* Borrow & Lend quick summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/borrow-lend" className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-rose-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Outstanding Debt (You Borrowed)</p>
              <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">₹{borrowLendOverview.totalBorrowed.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 hover:underline">Manage &rarr;</span>
        </Link>

        <Link to="/borrow-lend" className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Outstanding Receivables (You Lent)</p>
              <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">₹{borrowLendOverview.totalLent.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-teal-600 dark:text-teal-400 hover:underline">Manage &rarr;</span>
        </Link>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 pt-6 shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Cash Flow Overview</h4>
        <div className="relative w-full h-56 flex items-end justify-between px-2">
          {/* Y Axis Guide Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="w-full border-t border-dashed border-slate-100 dark:border-slate-800 h-0" />
            ))}
            <div className="w-full border-t border-slate-200 dark:border-slate-800 h-0" />
          </div>

          {/* SVG Bars Render */}
          <div className="w-full h-full z-10 flex items-end justify-around relative">
            {chartData.map((d, index) => {
              const incomeHeight = (d.income / maxChartVal) * 100
              const expenseHeight = (d.expenses / maxChartVal) * 100

              return (
                <div key={d.label} className="flex flex-col items-center gap-2 w-full max-w-[60px]">
                  <div className="flex gap-1.5 items-end justify-center h-40 w-full relative">
                    {/* Income Bar */}
                    <div 
                      className="w-3.5 sm:w-4 rounded-t bg-emerald-500 dark:bg-emerald-400 hover:brightness-110 transition-all duration-300 relative group cursor-pointer"
                      style={{ height: `${incomeHeight}%` }}
                      onMouseEnter={() => setHoveredBar({ index, type: 'Income', amount: d.income })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Expense Bar */}
                    <div 
                      className="w-3.5 sm:w-4 rounded-t bg-rose-500 dark:bg-rose-400 hover:brightness-110 transition-all duration-300 relative group cursor-pointer"
                      style={{ height: `${expenseHeight}%` }}
                      onMouseEnter={() => setHoveredBar({ index, type: 'Expense', amount: d.expenses })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {d.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Dynamic Tooltip on Hover */}
          {hoveredBar && (
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-xl shadow-xl z-20 pointer-events-none flex items-center gap-1.5 transition-all duration-200"
            >
              <span className={`w-2 h-2 rounded-full ${hoveredBar.type === 'Income' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="font-semibold">{hoveredBar.type}:</span>
              <span className="font-bold">₹{hoveredBar.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500 dark:bg-emerald-400" />
            <span>Income Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-500 dark:bg-rose-400" />
            <span>Expense Flow</span>
          </div>
        </div>
      </div>
      
      {/* Category breakdown visual progress trackers */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top Expenses by Category</span>
          <Link to="/expense" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">View Details &rarr;</Link>
        </div>
        <div className="space-y-3.5">
          {Object.entries(
            transactions
              .filter(t => t.type === 'expense')
              .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
                return acc
              }, {})
          )
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat, amt]) => {
              const percent = metrics.expenses > 0 ? Math.round((amt / metrics.expenses) * 100) : 0
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    <span>{cat}</span>
                    <span>₹{amt.toLocaleString('en-IN')} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 dark:bg-rose-400 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          {transactions.filter(t => t.type === 'expense').length === 0 && (
            <p className="text-center text-xs text-slate-400 font-medium py-3">No expenses logged for this period.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard