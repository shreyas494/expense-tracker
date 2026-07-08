import React, { useState, useMemo, useEffect } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Percent, Calendar } from 'lucide-react'
import axios from 'axios'

const Dashboard = () => {
  const { transactions, timeFrame, setTimeFrame, onLogout } = useOutletContext()
  const [hoveredBar, setHoveredBar] = useState(null)
  const [borrowLendOverview, setBorrowLendOverview] = useState({ totalBorrowed: 0, totalLent: 0 })

  useEffect(() => {
    const fetchBorrowLendOverview = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token")
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await axios.get("http://localhost:4000/api/borrow-lend/overview", { headers })
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

  // 1. Calculate stats for the selected time frame
  const metrics = useMemo(() => {
    let income = 0
    let expenses = 0
    
    transactions.forEach(t => {
      const amt = Number(t.amount || 0)
      if (t.type === 'income') income += amt
      else expenses += amt
    })

    const savings = income - expenses
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0

    return {
      income,
      expenses,
      savings,
      savingsRate
    }
  }, [transactions])

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
      <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded-xl border border-gray-150">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold px-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>FILTER PERIOD</span>
        </div>
        <div className="flex gap-1">
          {['daily', 'weekly', 'monthly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize cursor-pointer ${
                timeFrame === tf
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              {tf === 'daily' ? 'Today' : tf === 'weekly' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Mini Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            <span>Income</span>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-1">
            ₹{metrics.income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <TrendingDown className="w-3.5 h-3.5 text-orange-600" />
            <span>Expenses</span>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-1">
            ₹{metrics.expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            {metrics.savings >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
            )}
            <span>Net Savings</span>
          </div>
          <p className={`text-lg font-bold mt-1 ${metrics.savings >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
            ₹{metrics.savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <Percent className="w-3.5 h-3.5 text-cyan-600" />
            <span>Savings Rate</span>
          </div>
          <p className="text-lg font-bold text-gray-800 mt-1">
            {metrics.savingsRate}%
          </p>
        </div>
      </div>

      {/* Borrow & Lend quick summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/borrow-lend" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Outstanding Debt (You Borrowed)</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5">₹{borrowLendOverview.totalBorrowed.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-600 hover:underline">Manage &rarr;</span>
        </Link>

        <Link to="/borrow-lend" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Outstanding Receivables (You Lent)</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5">₹{borrowLendOverview.totalLent.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-600 hover:underline">Manage &rarr;</span>
        </Link>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="relative bg-white rounded-2xl border border-gray-100 p-4 pt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Cash Flow Chart</h4>
        <div className="relative w-full h-56 flex items-end justify-between px-2">
          {/* Y Axis Guide Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pr-2">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="w-full border-t border-dashed border-gray-100 h-0" />
            ))}
            <div className="w-full border-t border-gray-200 h-0" />
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
                      className="w-4 rounded-t bg-gradient-to-t from-teal-400 to-teal-500 hover:brightness-105 transition-all duration-300 relative group cursor-pointer"
                      style={{ height: `${incomeHeight}%` }}
                      onMouseEnter={() => setHoveredBar({ index, type: 'Income', amount: d.income })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />

                    {/* Expense Bar */}
                    <div 
                      className="w-4 rounded-t bg-gradient-to-t from-orange-400 to-orange-500 hover:brightness-105 transition-all duration-300 relative group cursor-pointer"
                      style={{ height: `${expenseHeight}%` }}
                      onMouseEnter={() => setHoveredBar({ index, type: 'Expense', amount: d.expenses })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {d.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Dynamic Tooltip on Hover */}
          {hoveredBar && (
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg z-20 pointer-events-none flex items-center gap-1.5 transition-all duration-200"
            >
              <span className={`w-2 h-2 rounded-full ${hoveredBar.type === 'Income' ? 'bg-teal-400' : 'bg-orange-400'}`} />
              <span className="font-semibold">{hoveredBar.type}:</span>
              <span className="font-bold">₹{hoveredBar.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 pt-2 border-t border-gray-50 text-xs font-semibold text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-teal-500" />
            <span>Income Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-orange-500" />
            <span>Expense Flow</span>
          </div>
        </div>
      </div>
      
      {/* Category breakdown visual progress trackers */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-150">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Expenses by Category</span>
          <Link to="/expense" className="text-xs font-bold text-teal-600 hover:text-teal-700">View Details</Link>
        </div>
        <div className="space-y-3">
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
                  <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                    <span>{cat}</span>
                    <span>₹{amt.toLocaleString('en-IN')} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              )
            })}
          {transactions.filter(t => t.type === 'expense').length === 0 && (
            <p className="text-center text-xs text-gray-400 font-medium py-3">No expenses logged for this period.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard