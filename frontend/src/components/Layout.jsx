import React, { useEffect, useMemo } from 'react'
import { styles } from '../assets/dummyStyles'
import Navbar from './Navbar'
import  Sidebar  from './Sidebar'
import { useState } from 'react'
import { Activity, ArrowDown, ArrowUp, Car, ChevronDown, ChevronUp, Clock, CreditCard, IndianRupee, Gift, Home, Info, PieChart, PiggyBank, RefreshCcw, RefreshCw, ShoppingCart, TrendingUp, Utensils, Zap, Search } from 'lucide-react'
import { Outlet, useLocation } from 'react-router-dom'
import axios from 'axios'
import SmsPromptModal from './SmsPromptModal'
import { AnimatePresence } from 'framer-motion'
import { scanReceiptWithOCR, compressImageForMobile } from '../utils/ocrParser'

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
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

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

  // Handle incoming Web Share Target parameters & SW cached share data (e.g. from GPay/PhonePe share sheet)
  useEffect(() => {
    const handleWebShareTarget = async () => {
      try {
        const isSharePath = window.location.pathname.includes('share-target');
        const urlParams = new URLSearchParams(window.location.search);
        let sharedTextContent = [
          urlParams.get('title') || '',
          urlParams.get('text') || '',
          urlParams.get('url') || ''
        ].filter(Boolean).join(' ');

        let imageBlob = null;

        // Clear query params & share-target path from URL bar
        if (window.location.search || isSharePath) {
          window.history.replaceState({}, document.title, '/');
        }

        // Check Service Worker cache for shared text or image
        if ('caches' in window) {
          try {
            const cache = await caches.open('share-cache');
            const cachedTextRes = await cache.match('/shared-text');
            if (cachedTextRes) {
              const text = await cachedTextRes.text();
              if (text) sharedTextContent = `${sharedTextContent} ${text}`.trim();
              await cache.delete('/shared-text');
            }

            const cachedImageRes = await cache.match('/shared-image');
            if (cachedImageRes) {
              imageBlob = await cachedImageRes.blob();
              await cache.delete('/shared-image');
            }
          } catch (cErr) {
            console.error("Cache share read error:", cErr);
          }
        }

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };

        if (imageBlob) {
          try {
            const compressedBase64 = await compressImageForMobile(imageBlob);
            if (compressedBase64) {
              try {
                const res = await axios.post(
                  `${API_BASE}/expense/scan-receipt`,
                  { imageBase64: compressedBase64, mimeType: 'image/jpeg' },
                  { headers }
                );

                if (res.data.success && res.data.data?.amount > 0) {
                  fetchPendingNotes();
                  return;
                }
              } catch (iErr) {
                console.error("Backend scan receipt error:", iErr);
              }
            }

            // Fallback to client-side OCR if backend scan returns 0 or fails
            try {
              const ocrResult = await scanReceiptWithOCR(imageBlob);
              if (ocrResult.amount > 0 || (ocrResult.description && ocrResult.description !== "Payment Transaction")) {
                const textToSubmit = ocrResult.rawText?.trim() || `Paid to ${ocrResult.description} ₹${ocrResult.amount}`;
                await axios.post(
                  `${API_BASE}/expense/sms-webhook`,
                  { text: textToSubmit },
                  { headers }
                );
              }
            } catch (cErr) {
              console.error("Client OCR share fallback error:", cErr);
            } finally {
              fetchPendingNotes();
            }
          } catch (blobErr) {
            console.error("Image blob read error:", blobErr);
          }
        } else if (sharedTextContent || isSharePath) {
          const textToSubmit = sharedTextContent || "Shared Payment Receipt";
          const res = await axios.post(
            `${API_BASE}/expense/sms-webhook`,
            { text: textToSubmit },
            { headers }
          );
          if (res.data.success) {
            fetchPendingNotes();
          }
        }
      } catch (err) {
        console.error("Error processing web share target:", err);
      }
    };

    handleWebShareTarget();
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
    allTransactions: transactions,
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

  const location = useLocation();
  const pageMeta = useMemo(() => {
    const p = location.pathname;
    if (p === '/income') return { title: 'Income', subtitle: 'Manage and track your income streams' };
    if (p === '/expense') return { title: 'Expenses', subtitle: 'Track and analyze your daily expenses' };
    if (p === '/borrow-lend') return { title: 'Borrow & Lend', subtitle: 'Manage personal debts, loans, and repayments' };
    if (p === '/challenges') return { title: 'Savings Challenges', subtitle: 'Gamify savings, build streaks & unlock badges' };
    if (p === '/reports') return { title: 'Financial Reports', subtitle: 'Export statement reports & setup SMS webhooks' };
    if (p === '/profile') return { title: 'Account Profile', subtitle: 'Manage your user credentials and security' };
    return { title: 'Dashboard', subtitle: 'Welcome back' };
  }, [location.pathname]);

  const displayedTransactions = showAllTransactions
    ? searchedTransactions
    : searchedTransactions.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-300">
      <Navbar user={user} onLogout={onLogout} theme={theme} toggleTheme={toggleTheme}/>
      <Sidebar user={user} isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed}/>
      <div className={styles.layout.mainContainer(sidebarCollapsed)}>
        <div className={styles.header.container}>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {pageMeta.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-semibold mt-1">
              {pageMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <main className="mt-4 pb-24">
          <Outlet context={outletContext}/>
        </main>
      </div>

      <AnimatePresence>
        {pendingNotes.length > 0 && (
          <SmsPromptModal
            transaction={pendingNotes[0]}
            onClose={() => setPendingNotes(prev => prev.slice(1))}
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