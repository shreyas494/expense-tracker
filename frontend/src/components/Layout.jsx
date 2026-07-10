import React, { useEffect, useMemo } from 'react'
import { styles } from '../assets/dummyStyles'
import Navbar from './Navbar'
import  Sidebar  from './Sidebar'
import { useState } from 'react'
import { Activity, ArrowDown, ArrowUp, Car, ChevronDown, ChevronUp, Clock, CreditCard, IndianRupee, Gift, Home, Info, PieChart, PiggyBank, RefreshCcw, RefreshCw, ShoppingCart, TrendingUp, Utensils, Zap, Search } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import axios from 'axios'
import SmsPromptModal from './SmsPromptModal'
import { AnimatePresence } from 'framer-motion'


const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api`
const CATEGORY_ICONS = {
  Food: <Utensils className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Shopping: <ShoppingCart className="w-4 h-4" />,
  Entertainment: <Gift className="w-4 h-4" />,
  Utilities: <Zap className="w-4 h-4" />,
  Healthcare: <Activity className="w-4 h-4" />,
  Salary: <ArrowUp className="w-4 h-4" />,
  Freelance: <CreditCard className="w-4 h-4" />,
  Savings: <PiggyBank className="w-4 h-4" />,
};

// to filter 
const filterTransactions = (transactions, frame) => {
  const now = new Date();
  const today = new Date(now).setHours(0, 0, 0, 0);

  switch (frame) {
    case "daily":
      return transactions.filter((t) => new Date(t.date) >= today);
    case "weekly": {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return transactions.filter((t) => new Date(t.date) >= startOfWeek);
    }
    case "monthly":
      return transactions.filter(
        (t) => new Date(t.date).getMonth() === now.getMonth()
      );
    default:
      return transactions;
  }
};

const safeArrayFromResponse = (res) => {
  const body = res?.data;
  if (!body) return [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.data)) return body.data;
  if (Array.isArray(body.incomes)) return body.incomes;
  if (Array.isArray(body.expenses)) return body.expenses;
  return [];
};

const Layout = ({onLogout, user, onUserUpdate}) =>{
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const [transactions, setTransactions] = useState([]);
  const [timeFrame, setTimeFrame] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingNotes, setPendingNotes] = useState([]);

  // Fetch transactions needing notes/category updates
  const fetchPendingNotes = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API_BASE}/expense/pending-notes`, { headers });
      if (res.data.success && res.data.data) {
        setPendingNotes(res.data.data);
      }
    } catch (err) {
      console.error("fetchPendingNotes error:", err);
    }
  };

  // Poll for new SMS transactions every 10 seconds
  useEffect(() => {
    fetchPendingNotes();
    const interval = setInterval(fetchPendingNotes, 10000);
    return () => clearInterval(interval);
  }, []);


  // to fetch transactions from server side
   const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [incomeRes, expenseRes, borrowLendRes] = await Promise.all([
        axios.get(`${API_BASE}/income/get`, { headers }),
        axios.get(`${API_BASE}/expense/get`, { headers }),
        axios.get(`${API_BASE}/borrow-lend/get`, { headers }),
      ]);

      const incomes = safeArrayFromResponse(incomeRes).map((i) => ({
        ...i,
        type: "income",
      }));
      const expenses = safeArrayFromResponse(expenseRes).map((e) => ({
        ...e,
        type: "expense",
      }));
      const borrowLend = safeArrayFromResponse(borrowLendRes).map((b) => ({
        ...b,
        type: b.type,
      }));

      const allTransactions = [...incomes, ...expenses, ...borrowLend]
        .map((t) => ({
          id: t._id || t.id || t.id_str || Math.random().toString(36).slice(2),
          description: t.description || t.title || t.note || (t.type === 'borrow' ? `Borrowed from ${t.person}` : `Lent to ${t.person}`),
          amount: t.amount != null ? Number(t.amount) : Number(t.value) || 0,
          date: t.date || t.createdAt || new Date().toISOString(),
          category: t.category || (t.type === 'borrow' ? 'Borrow' : t.type === 'lend' ? 'Lend' : 'Other'),
          type: t.type,
          raw: t,
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(allTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      if (err?.response?.status === 401) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // to add transaction either income or expense 
  const addTransaction = async (transaction) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint =
        transaction.type === "income" ? "income/add" : "expense/add";
      await axios.post(`${API_BASE}/${endpoint}`, transaction, { headers });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to add transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  };


  // to edit any transaction
  const editTransaction = async (id, transaction) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint =
        transaction.type === "income" ? "income/update" : "expense/update";
      await axios.put(`${API_BASE}/${endpoint}/${id}`, transaction, {
        headers,
      });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to edit transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  };

  // to delete a transaction
  const deleteTransaction = async (id, type) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const endpoint = type === "income" ? "income/delete" : "expense/delete";
      await axios.delete(`${API_BASE}/${endpoint}/${id}`, { headers });
      await fetchTransactions();
      return true;
    } catch (err) {
      console.error(
        "Failed to delete transaction",
        err?.response || err.message || err
      );
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, timeFrame),
    [transactions, timeFrame]
  ); // filter with timeframe

  const searchedTransactions = useMemo(() => {
    return filteredTransactions.filter((t) => {
      const matchText = 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchText;
    });
  }, [filteredTransactions, searchQuery]);

  // get stats data according to time 
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const last30DaysTransactions = transactions.filter(
      (t) => new Date(t.date) >= thirtyDaysAgo
    );

    const last30DaysIncome = last30DaysTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const last30DaysExpenses = last30DaysTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const allTimeExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate =
      last30DaysIncome > 0
        ? Math.round(
            ((last30DaysIncome - last30DaysExpenses) / last30DaysIncome) * 100
          )
        : 0;

    const last60DaysAgo = new Date(now);
    last60DaysAgo.setDate(now.getDate() - 60);

    const previous30DaysTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= last60DaysAgo && date < thirtyDaysAgo;
    });

    const previous30DaysExpenses = previous30DaysTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseChange =
      previous30DaysExpenses > 0
        ? Math.round(
            ((last30DaysExpenses - previous30DaysExpenses) /
              previous30DaysExpenses) *
              100
          )
        : 0;

    return {
      totalTransactions: transactions.length,
      last30DaysIncome,
      last30DaysExpenses,
      last30DaysSavings: last30DaysIncome - last30DaysExpenses,
      allTimeIncome,
      allTimeExpenses,
      allTimeSavings: allTimeIncome - allTimeExpenses,
      last30DaysCount: last30DaysTransactions.length,
      savingsRate,
      expenseChange,
    };
  }, [transactions]);

  const timeFrameLabel = useMemo(
    () =>
      timeFrame === "daily"
        ? "Today"
        : timeFrame === "weekly"
        ? "This Week"
        : "This Month",
    [timeFrame]
  );

  const outletContext = {
    transactions: filteredTransactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    refreshTransactions: fetchTransactions,
    timeFrame,
    setTimeFrame,
    lastUpdated,
    user,
    onUserUpdate,
    onLogout,
    theme,
    toggleTheme,
  };

  const getSavingsRating = (rate) =>
    rate > 30 ? "Excellent" : rate > 20 ? "Good" : "Needs improvement";

  // for filter using category 
  const topCategories = useMemo(
    () =>
      Object.entries(
        transactions
          .filter((t) => t.type === "expense")
          .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
          }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    [transactions]
  );

  const displayedTransactions = showAllTransactions
    ? searchedTransactions
    : searchedTransactions.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 flex flex-col font-sans antialiased transition-colors duration-300">
    <Navbar user={user} onLogout={onLogout} theme={theme} toggleTheme={toggleTheme}/>
    <Sidebar user={user} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed}/>
    <div className={styles.layout.mainContainer(sidebarCollapsed)}>
      <div className={styles.header.container}>
          <div>
            <h1 className={styles.header.title}>
            Dashboard

            </h1>
            <p className={styles.header.subtitle}> Welcome back </p>
          </div>
      </div>

      <div className={styles.statCards.grid}>
        <div className={styles.statCards.card}>
         <div className={styles.statCards.cardHeader}>
            <div className="flex-1 min-w-0 mr-2">
                <p className={styles.statCards.cardTitle}>Total Balance</p>
                <p className={styles.statCards.cardValue}>
                ₹{stats.allTimeSavings.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
                </p>
            </div>
            <div className={styles.statCards.iconContainer("teal")}>
            <IndianRupee className={styles.statCards.icon("teal")}/>


            </div>
          </div>
          <p className={styles.statCards.cardFooter}>
          <span className="text-teal-600 font-medium">
            +₹{stats.last30DaysSavings.toLocaleString("en-IN")}</span>{" "}
            this month 
          </p>
        </div>

        {/* for income*/}
        <div className={styles.statCards.card}>
         <div className={styles.statCards.cardHeader}>
            <div className="flex-1 min-w-0 mr-2">
                <p className={styles.statCards.cardTitle}>Monthly Income</p>
                <p className={styles.statCards.cardValue}>
                ₹{stats.last30DaysIncome.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
                </p>
            </div>
            <div className={styles.statCards.iconContainer("green")}>
            <ArrowUp className={styles.statCards.icon("green")}/>


            </div>
          </div>
          <p className={styles.statCards.cardFooter}>
          <span className="text-green-600 font-medium">
                  +12.5%
            </span>{" "}
            from last month 


          </p>
        </div>








        <div className={styles.statCards.card}>
         <div className={styles.statCards.cardHeader}>
            <div className="flex-1 min-w-0 mr-2">
                <p className={styles.statCards.cardTitle}>Monthly Expense</p>
                <p className={styles.statCards.cardValue}>
                ₹{stats.last30DaysExpenses.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
                </p>
            </div>
            <div className={styles.statCards.iconContainer("orange")}>
            <ArrowDown className={styles.statCards.icon("orange")}/>


            </div>
          </div>
          <p className={styles.statCards.cardFooter}>
          <span className={`${styles.colors.expenseChange(
            stats.expenseChange
          )} font-medium`}>
            {stats.expenseChange > 0 ? "+" : ""}
            {stats.expenseChange}%
          </span>{" "}
          from last month 
          </p>
        </div>

        <div className={styles.statCards.card}>
         <div className={styles.statCards.cardHeader}>
            <div className="flex-1 min-w-0 mr-2">
                <p className={styles.statCards.cardTitle}>Saving Rate</p>
                <p className={styles.statCards.cardValue}>
                {stats.savingsRate}%

                </p>
            </div>
            <div className={styles.statCards.iconContainer("blue")}>
            <PiggyBank className={styles.statCards.icon("blue")}/>


            </div>
          </div>
          <p className={styles.statCards.cardFooter}>
         {getSavingsRating(stats.savingsRate)}


          </p>
        </div>
      </div>

      <div className={styles.grid.main}>
        <div className={styles.grid.leftColumn}>
          <div className={styles.cards.base}>
              <div className={styles.cards.header}>
                <h3 className={styles.cards.title}>
                <TrendingUp className="w-6 h-6 text-teal-500"/>
                    financial overview 
                    <span className="text-sm text-gray-500 font-normal">
                      ({timeFrameLabel})
                    </span>
                </h3>

              </div>
              <Outlet context={outletContext}/>
          </div>
        </div>

        {/* right side */}
        <div className={styles.grid.rightColumn}>
          <div className={styles.cards.base}>
              <div className={styles.transactions.cardHeader}>
                  <h3 className={styles.transactions.cardTitle}>
                        <Clock className="w-6 h-6 text-purple-600"/>
                        Recent Transactions
                  </h3>
                  <button onClick={fetchTransactions} disabled={loading}
                  className={styles.transactions.refreshButton}>
                  <RefreshCw className={styles.transactions.refreshIcon(loading)}/>

                  </button>

              </div>

              {/* Search Bar for Recent Transactions */}
              <div className="px-5 mb-4 relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search recent transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white"
                />
              </div>

              <div className={styles.transactions.dataStackingInfo}>
              <Info className={styles.transactions.dataStackingIcon}/>
              <span> Transactions are stacked by date (newest first)</span>
              </div>

              <div className={styles.transactions.listContainer}>
              {displayedTransactions.map((transaction) => {
                const {id, type, category, description, date, amount,} = transaction;
                return(
                  <div key={id} className={styles.transactions.transactionItem}>
                  <div className="flex items-center gap-1 md:gap-4 lg:gap-3">
                      <div className={`p-2 rounded-lg ${styles.colors.transaction.bg( 
                        type
                      )}`}> 
                      {CATEGORY_ICONS[category] || (
                        <IndianRupee className={styles.transactions.icon}/>

                      )}
                             
                      </div>
                      <div className={styles.transactions.details}>
                        <p className={styles.transactions.description}>
                        {description}

                        </p>
                        <p className={styles.transactions.meta}>
                        {new Date(date).toLocaleDateString()}
                        <span className="ml-2 capitalize">
                        {category}

                        </span>

                        </p>

                      </div>


                  </div>

                  <span className={styles.colors.transaction.text(type)}>
                  {type === "income" ? "+" : "-"}₹{Number(amount)}
                  </span>


                  </div>
                );
              })}

              {transactions.length === 0 ? (
                <div className={styles.transactions.emptyState}>
                    <div className={styles.transactions.emptyIconContainer}>
                    <Clock className={styles.transactions.emptyIcon}/>

                    </div>
                    <p className={styles.transactions.emptyText}>

                      no recent transactions
                    </p>

                </div>
              ) : (
                <div className={styles.transactions.viewAllContainer} >
                <button onClick={() => setShowAllTransactions(!showAllTransactions)}
                className={styles.transactions.viewAllButton}>

                {showAllTransactions ? (
                  <>
                    <ChevronUp className="w-5 h-5"/>
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-5 h-5"/>
                    View All Transactions ({transactions.length})
                  </>
                )}

                </button>

                </div>
              )}



              </div>


          </div>

          {/* spending by category card */}
          <div className={styles.cards.base}>
              <h3 className={styles.categories.title}>
                  <PieChart className={styles.categories.titleIcon}/>
                  Spending by Category

              </h3>
              <div className={styles.categories.list}>
                  {topCategories.map(([category, amount]) => (
                    <div key={category} className={styles.categories.categoryItem}>
                        <div className="flex items-center gap-3 ">
                             <div className={styles.categories.categoryIconContainer}>
                             {CATEGORY_ICONS[category] || (
                              < IndianRupee className={styles.categories.categoryIcon}/>
                             )}

                             </div>

                             <span className={styles.categories.categoryName}>
                             {category}
                              </span>
                          </div>
                          <span className={styles.categories.categoryAmount}>
                          ₹{amount}
                          </span>

                    </div>
                  ))}
                </div>

                <div className={styles.categories.summaryContainer}>
                    <div className={styles.categories.summaryGrid}>
                        <div className={styles.categories.summaryIncomeCard}>
                            <p className={styles.categories.summaryTitle}>
                            Total Income  
                            </p>
                            <p className={styles.categories.summaryValue}>
                            ₹{stats.allTimeIncome.toLocaleString("en-IN")}
                             </p>
                          </div>

                          <div className={styles.categories.summaryExpenseCard}>
                            <p className={styles.categories.summaryTitle}>
                            Total Expense  
                            </p>
                            <p className={styles.categories.summaryValue}>
                            ₹{stats.allTimeExpenses.toLocaleString("en-IN")}
                             </p>
                          </div>



                    </div>
                </div>

          </div>


        </div>


      </div>
    </div>

    <AnimatePresence>
      {pendingNotes.length > 0 && (
        <SmsPromptModal
          transaction={pendingNotes[0]}
          onClose={() => {
            // Remove current transaction from the queue (skip/dismiss)
            setPendingNotes(prev => prev.slice(1));
          }}
          onSaved={async () => {
            await fetchTransactions();
            await fetchPendingNotes();
          }}
        />
      )}
    </AnimatePresence>
    </div>



  )
}

export default Layout