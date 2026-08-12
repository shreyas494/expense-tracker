// assets/dummyStyles.js

// assets/dummyStyles.js - Unified Design System Tokenized Styles

export const dashboardStyles = {
  // Layout styles
  container: "min-h-screen p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto",
  
  // Header styles
  headerContainer: "bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden",
  headerContent: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10",
  headerTitle: "text-3xl md:text-4xl font-extrabold tracking-tight text-white",
  headerSubtitle: "text-slate-400 mt-1 text-sm md:text-base font-medium",
  
  // Button styles
  addButton: "flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg text-sm cursor-pointer",
  
  // Time frame selector styles
  timeFrameContainer: "flex justify-end mt-4",
  timeFrameWrapper: "flex gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60",
  timeFrameButton: (isActive) => 
    `px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
      isActive 
        ? "bg-teal-500 text-slate-950 shadow-sm" 
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
    }`,
  
  // Summary cards grid
  summaryGrid: "grid grid-cols-1 md:grid-cols-3 gap-5 mb-8",
  
  // Financial card styles
  balanceBadge: "bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-teal-500/20",
  expenseBadge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full text-xs font-semibold border border-rose-500/20",
  
  // Gauge container styles
  gaugeGrid: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",
  
  // Pie chart container styles
  pieChartContainer: "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden mb-8",
  pieChartHeader: "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3",
  pieChartTitle: "text-lg md:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3",
  pieChartSubtitle: "text-xs md:text-sm text-slate-500 dark:text-slate-400",
  pieChartHeight: "h-80",
  
  // Pie chart tooltip styles
  tooltipContent: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    padding: "12px",
    color: "#f8fafc",
  },
  tooltipItem: { fontWeight: 500 },
  
  // Legend styles
  legendWrapper: { paddingTop: 8 },
  legendText: "text-xs font-semibold text-slate-600 dark:text-slate-400",
  
  // Income/Expense lists grid
  listsGrid: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  
  // List container styles
  listContainer: "bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200/80 dark:border-slate-800",
  listHeader: "flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3",
  listTitle: "text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3",
  listSubtitle: "text-xs text-slate-500 dark:text-slate-400 font-normal",
  
  // Record count badges
  incomeCountBadge: "text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold",
  expenseCountBadge: "text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-semibold",
  
  // Transaction item styles
  transactionList: "space-y-3",
  incomeTransactionItem: "flex items-center justify-between p-3.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors",
  expenseTransactionItem: "flex items-center justify-between p-3.5 bg-rose-500/5 dark:bg-rose-500/10 rounded-xl border border-rose-500/10 hover:bg-rose-500/10 transition-colors",
  
  // Transaction icon container
  incomeIconContainer: "p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0",
  expenseIconContainer: "p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shrink-0",
  
  // Transaction content
  transactionContent: "flex items-center gap-3 min-w-0 flex-1",
  transactionDescription: "font-semibold text-slate-900 dark:text-white truncate text-sm",
  transactionCategory: "text-xs text-slate-500 dark:text-slate-400",
  transactionAmount: "text-right shrink-0 font-extrabold text-sm",
  incomeAmount: "text-emerald-600 dark:text-emerald-400",
  expenseAmount: "text-rose-600 dark:text-rose-400",
  transactionDate: "text-xs text-slate-500 dark:text-slate-400",
  
  // Empty state styles
  emptyState: "text-center py-10",
  emptyIconContainer: (color) => `w-14 h-14 mx-auto mb-3 rounded-2xl ${color} flex items-center justify-center`,
  emptyText: "text-slate-600 dark:text-slate-400 font-semibold text-sm",
  
  // View all button styles
  viewAllContainer: "pt-4 border-t border-slate-100 dark:border-slate-800",
  viewAllButton: "w-full flex items-center justify-center gap-2 py-2.5 text-teal-600 dark:text-teal-400 font-semibold text-xs hover:bg-teal-500/10 rounded-xl transition-colors cursor-pointer",
  
  // Icon container styles
  iconContainer: (color) => `p-2.5 ${color} rounded-xl`,
  
  // Specific icon colors
  walletIconContainer: "p-2.5 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl",
  arrowDownIconContainer: "p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl",
  piggyBankIconContainer: "p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl",
};

export const trendStyles = {
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-rose-600 dark:text-rose-400",
  positiveRate: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  negativeRate: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

export const chartStyles = {
  pieChart: "text-xs font-medium",
};

export const incomeStyles = {
  wrapper: "space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8",
  headerContainer: "bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6",
  header: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4",
  headerTitle: "text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight",
  headerSubtitle: "text-slate-500 dark:text-slate-400 mt-1 text-xs md:text-sm font-medium",
  addButton: "flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow text-xs md:text-sm font-bold cursor-pointer",
  
  summaryGrid: "grid grid-cols-1 md:grid-cols-3 gap-5",
  
  chartContainer: "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800",
  chartTitle: "text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5",
  
  listContainer: "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden",
  sectionTitle: "text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2.5",
  
  filterContainer: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto",
  filterSelect: "appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 w-full cursor-pointer",
  exportButton: "flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer",
  
  transactionList: "space-y-3",
  viewAllButton: "mt-4 w-full text-center py-2.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs hover:bg-emerald-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer",
  
  emptyStateContainer: "text-center py-10",
  emptyStateIcon: "w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center",
  emptyStateText: "text-slate-700 dark:text-slate-300 font-bold text-sm",
  emptyStateSubtext: "text-xs text-slate-500 dark:text-slate-400 mt-1",
  emptyStateButton: "mt-4 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm mx-auto text-xs font-bold cursor-pointer",
  
  timeFrameContainer: "flex justify-end mt-4",
  chartHeaderContainer: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5",
  chartHeight: "h-72 md:h-80",
  
  tooltipContent: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    padding: "12px",
    color: "#f8fafc",
  },
  
  iconGreen: "p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl",
  iconBlue: "p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl",
  iconPurple: "p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl",
  
  textGreen: "text-emerald-600 dark:text-emerald-400",
  textBlue: "text-cyan-600 dark:text-cyan-400",
  textPurple: "text-purple-600 dark:text-purple-400",
  
  filterIcon: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none",
  
  borderGreen: "border-l-4 border-emerald-500",
  borderBlue: "border-l-4 border-cyan-500",
  borderPurple: "border-l-4 border-purple-500",
};

export const expensePageStyles = {
  container: "space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8",
  headerCard: "bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6",
  headerContainer: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4",
  headerTitle: "text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight",
  headerSubtitle: "text-slate-500 dark:text-slate-400 mt-1 text-xs md:text-sm font-medium",
  addButton: "flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow text-xs md:text-sm font-bold cursor-pointer",
  
  cardsGrid: "grid grid-cols-1 md:grid-cols-3 gap-5",
  
  chartContainer: "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800",
  chartHeader: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5",
  chartTitle: "text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5",
  exportButton: "flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer",
  chart: "h-80",
  
  transactionsContainer: "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden",
  transactionsHeader: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5",
  transactionsTitle: "text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5",
  filterSelect: "appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-rose-500 w-full cursor-pointer",
  
  transactionsList: "space-y-3",
  viewAllButton: "mt-4 w-full text-center py-2.5 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-500/10 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer",
  emptyState: "text-center py-10",
  emptyStateIcon: "w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center",
  emptyStateText: "text-slate-700 dark:text-slate-300 font-bold text-sm",
  emptyStateSubtext: "text-xs text-slate-500 dark:text-slate-400 mt-1",
  
  iconOrange: "p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl",
  iconAmber: "p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl",
  iconYellow: "p-2.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-xl",
  textOrange: "text-rose-600 dark:text-rose-400",
  textAmber: "text-amber-600 dark:text-amber-400",
  textYellow: "text-yellow-600 dark:text-yellow-400",
  
  borderOrange: "border-l-4 border-rose-500",
  borderAmber: "border-l-4 border-amber-500",
  borderYellow: "border-l-4 border-yellow-500",
  tooltipContent: {
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
    padding: "12px",
    color: "#f8fafc",
  },
  
  chartHeight: "h-80",
  chartExportButton: "flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer",
  timeframePositioning: "flex justify-end mt-4",
  transactionItemContainer: "flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all border border-slate-200/80 dark:border-slate-800/80 cursor-pointer mb-3 group",
  transactionAmount: "font-bold text-sm",
  transactionIcon: "p-2.5 rounded-xl shrink-0",
};

export const profileStyles = {
  container: "max-w-4xl mx-auto py-6 px-4 md:px-6 space-y-6",
  mainContainer: "bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden",
  
  header: "bg-slate-900 p-8 text-center relative border-b border-slate-800",
  avatar: "w-24 h-24 mx-auto rounded-full bg-teal-500/20 text-teal-400 border-2 border-teal-500/30 flex items-center justify-center mb-4 text-3xl font-black shadow-lg",
  userName: "text-2xl font-extrabold text-white tracking-tight",
  userEmail: "text-slate-400 text-xs font-medium mt-1",
  
  content: "p-6 md:p-8 space-y-6",
  grid: "grid grid-cols-1 md:grid-cols-2 gap-6",
  
  card: "bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60",
  cardTitle: "text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2",
  icon: "w-5 h-5 text-teal-500 dark:text-teal-400",
  
  label: "text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5",
  input: "w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-xs font-semibold text-slate-900 dark:text-white transition-all",
  inputWithError: "w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-rose-500 rounded-xl focus:ring-2 focus:ring-rose-500 text-xs font-semibold text-slate-900 dark:text-white transition-all",
  
  buttonPrimary: "w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer",
  buttonSecondary: "w-full py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer",
  editButton: "text-teal-600 dark:text-teal-400 hover:text-teal-500 font-bold text-xs cursor-pointer",
  changeButton: "text-teal-600 dark:text-teal-400 hover:text-teal-500 font-bold text-xs cursor-pointer",
  
  securityItem: "flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800",
  securityText: "font-semibold text-xs text-slate-700 dark:text-slate-300",
  
  modalContent: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl",
  modalHeader: "flex justify-between items-center mb-6",
  modalTitle: "text-lg font-extrabold text-slate-900 dark:text-white",
  
  passwordLabel: "block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5",
  passwordContainer: "relative",
  passwordToggle: "absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer",
  
  errorText: "mt-1.5 text-xs font-bold text-rose-500"
};

export const modalStyles = {
  overlay: "fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50",
  modalContainer: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden",
  
  modalHeader: "flex justify-between items-center mb-5",
  modalTitle: "text-lg font-extrabold text-slate-900 dark:text-white",
  closeButton: "text-slate-400 hover:text-slate-200 cursor-pointer transition-colors",
  
  form: "space-y-4",
  label: "block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5",
  input: (ringColor) => `w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${ringColor}`,
  
  typeButtonContainer: "flex gap-3",
  typeButton: (isSelected, color) => 
    `flex-1 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
      isSelected 
        ? `${color} text-white shadow-sm` 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`,
  
  submitButton: (color) => `w-full text-white py-3 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer ${color}`,
  
  colorClasses: {
    teal: {
      button: "bg-teal-600 hover:bg-teal-500",
      ring: "focus:ring-teal-500",
      typeButtonSelected: "bg-teal-600",
    },
    orange: {
      button: "bg-rose-600 hover:bg-rose-500",
      ring: "focus:ring-rose-500",
      typeButtonSelected: "bg-rose-600",
    },
  },
};

export const loginStyles = {
  pageContainer: "min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden",
  cardContainer: "w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 relative z-10 text-white",
  header: "text-center mb-8",
  avatar: "w-16 h-16 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 flex items-center justify-center mx-auto mb-4 shadow-inner",
  headerTitle: "text-2xl font-extrabold text-white tracking-tight",
  headerSubtitle: "text-xs font-semibold text-slate-400 mt-1.5",
  formContainer: "space-y-5",
  errorContainer: "flex items-center gap-3 bg-rose-500/10 text-rose-400 p-4 rounded-2xl text-xs font-semibold border border-rose-500/20 mb-4",
  errorIcon: "flex-shrink-0 text-rose-400",
  errorText: "font-semibold",
  label: "block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5",
  inputContainer: "relative flex items-center",
  inputIcon: "absolute left-4 text-slate-500 pointer-events-none w-4 h-4",
  input: "w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-100 font-semibold text-xs placeholder-slate-500 transition-all",
  paswordinput: "w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-100 font-semibold text-xs placeholder-slate-500 transition-all",
  passwordToggle: "absolute right-4 text-slate-400 hover:text-slate-200 focus:outline-none transition-colors cursor-pointer",
  submitButton: "w-full py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg hover:shadow-teal-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50",
  checkboxContainer: "flex items-center justify-between mb-6",
  checkboxLabel: "flex items-center gap-2.5 text-xs font-semibold text-slate-400 cursor-pointer select-none",
  checkbox: "w-4 h-4 rounded text-teal-500 focus:ring-teal-500 border-slate-700 bg-slate-800 transition-colors",
  forgotPassword: "text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors",
  footerText: "text-center text-xs font-semibold text-slate-500 mt-8",
  footerLink: "text-teal-400 hover:text-teal-300 font-bold transition-colors ml-1"
};

export const navbarStyles = {
  header: "sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors",
  container: "flex items-center justify-between px-4 py-3 md:px-8 max-w-7xl mx-auto",
  
  logoContainer: "flex items-center gap-2 cursor-pointer group",
  logoImage: "w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-200 dark:border-slate-800",
  logo: "w-full h-full object-cover",
  logoText: "text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight",
  
  userContainer: "relative",
  userButton: "flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700",
  userAvatar: "w-8 h-8 flex items-center justify-center rounded-xl bg-teal-500 text-slate-950 font-black text-sm shadow-sm",
  statusIndicator: "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900",
  userTextContainer: "text-left hidden md:block",
  userName: "text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]",
  userEmail: "text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]",
  chevronIcon: (isOpen) => `w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`,
  
  dropdownMenu: "absolute top-12 right-0 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden p-1.5",
  dropdownHeader: "px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 mb-1",
  dropdownAvatar: "w-9 h-9 rounded-xl bg-teal-500 text-slate-950 font-black text-sm flex items-center justify-center",
  dropdownName: "text-xs font-bold text-slate-900 dark:text-white",
  dropdownEmail: "text-[10px] text-slate-500 dark:text-slate-400",
  
  menuItemContainer: "space-y-0.5",
  menuItem: "w-full px-3.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2.5 rounded-xl transition-colors cursor-pointer",
  menuItemBorder: "pt-1 mt-1 border-t border-slate-100 dark:border-slate-800",
  logoutButton: "flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
};

export const signupStyles = {
  pageContainer: "min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden",
  cardContainer: "w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-white relative z-10",
  header: "p-6 text-center relative border-b border-slate-800 bg-slate-900/50",
  avatar: "w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3 shadow-inner",
  headerTitle: "text-2xl font-extrabold text-white tracking-tight",
  headerSubtitle: "text-xs font-semibold text-slate-400 mt-1",
  backButton: "absolute top-4 left-4 p-2 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer",
  
  formContainer: "p-8 space-y-5",
  apiError: "text-center text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl",
  fieldError: "mt-1 text-[10px] font-bold text-rose-400",
  
  label: "block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5",
  inputContainer: "relative flex items-center",
  inputIcon: "absolute left-4 text-slate-500 pointer-events-none w-4 h-4",
  input: "w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-100 font-semibold text-xs placeholder-slate-500 transition-all",
  passwordInput: "w-full pl-11 pr-11 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-100 font-semibold text-xs placeholder-slate-500 transition-all",
  passwordToggle: "absolute right-4 text-slate-400 hover:text-slate-200 cursor-pointer",
  
  checkboxContainer: "mb-5 flex items-center",
  checkbox: "w-4 h-4 text-teal-500 focus:ring-teal-500 border-slate-700 bg-slate-800 rounded",
  checkboxLabel: "ml-2.5 block text-xs font-semibold text-slate-400 cursor-pointer",
  
  button: "w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs py-3.5 rounded-xl shadow-lg hover:shadow-teal-500/20 transition-all flex items-center justify-center cursor-pointer",
  buttonDisabled: "opacity-50 cursor-not-allowed",
  
  signInContainer: "mt-6 text-center",
  signInText: "text-xs font-semibold text-slate-500",
  signInLink: "font-bold text-teal-400 hover:text-teal-300 ml-1 transition-colors",
  spinner: "animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950"
};

export const transactionItemStyles = {
  container: (isEditing, classes) => 
    `flex flex-col md:flex-row items-stretch justify-between gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-3 last:mb-0 transition-all ${isEditing ? classes.bg : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`,
  
  mainContainer: "flex items-center gap-3 flex-1 min-w-0",
  actionsContainer: "flex items-center justify-between gap-3 mt-2 md:mt-0",
  amountContainer: "min-w-[100px] flex-shrink-0 flex justify-end",
  buttonsContainer: "flex gap-1.5 flex-shrink-0",
  
  iconContainer: (iconClass, classes) => `${iconClass} ${classes.iconBg}`,
  
  contentContainer: "min-w-0 flex-1",
  description: "font-bold text-slate-900 dark:text-white truncate text-xs md:text-sm",
  details: "text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate",
  
  input: (hasError, classes) => 
    `w-full bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? "border-rose-500 ring-rose-500" : `${classes.border} ${classes.ring}`}`,
  amountInput: (hasError, classes) => 
    `w-full max-w-[120px] bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? "border-rose-500 ring-rose-500" : `${classes.border} ${classes.ring}`}`,
  
  errorText: "text-[10px] font-bold text-rose-500 mt-1",
  
  amountText: (amountClass, classes) => `${amountClass} ${classes.text}`,
  
  saveButton: (classes) => `p-2 ${classes.button} rounded-xl cursor-pointer`,
  cancelButton: "p-2 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-300 cursor-pointer",
  editButton: (classes) => `p-2 ${classes.text} rounded-xl hover:${classes.bg} cursor-pointer`,
  deleteButton: (classes) => `p-2 ${classes.text} rounded-xl hover:${classes.bg} cursor-pointer`
};

export const sidebarStyles = {
  sidebarContainer: {
    base: "hidden lg:flex flex-col pt-3 fixed top-[65px] bottom-0 z-30 transition-all duration-300"
  },
  
  sidebarInner: {
    base: "bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 shadow-sm h-full flex flex-col justify-between"
  },
  
  userProfileContainer: {
    base: "p-4 border-b border-slate-100 dark:border-slate-800",
    collapsed: "px-3",
    expanded: "px-5"
  },
  
  userInitials: {
    base: "w-10 h-10 rounded-xl bg-teal-500 text-slate-950 font-extrabold flex items-center justify-center text-sm shadow-sm"
  },
  
  menuList: {
    base: "space-y-1 px-3 py-4"
  },
  
  menuItem: {
    base: "relative flex items-center gap-3 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer",
    active: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 font-bold",
    inactive: "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80",
    collapsed: "justify-center px-0 mx-1",
    expanded: "px-4"
  },
  
  menuIcon: {
    active: "text-teal-600 dark:text-teal-400",
    inactive: "text-slate-400 dark:text-slate-500"
  },
  
  activeIndicator: "absolute right-3 w-1.5 h-1.5 bg-teal-500 rounded-full",
  
  toggleButton: {
    base: "absolute -right-3 top-6 z-20 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-teal-500 transition-all cursor-pointer shadow-sm"
  },
  
  footerContainer: {
    base: "border-t border-slate-100 dark:border-slate-800 p-4",
    collapsed: "px-3",
    expanded: "px-5"
  },
  
  footerLink: {
    base: "flex items-center gap-3 py-2 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer",
    collapsed: "justify-center"
  },
  
  logoutButton: {
    base: "flex items-center gap-3 py-2 rounded-xl font-semibold text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 w-full mt-1 cursor-pointer transition-colors",
    collapsed: "justify-center"
  },
  
  mobileOverlay: "fixed inset-0 z-40 lg:hidden",
  mobileBackdrop: "absolute inset-0 bg-slate-950/60 backdrop-blur-sm",
  
  mobileSidebar: {
    base: "absolute left-0 top-0 bottom-0 w-4/5 max-w-xs bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden z-50"
  },
  
  mobileHeader: "p-5 flex justify-between items-center border-b border-slate-100 dark:border-slate-800",
  mobileUserContainer: "flex items-center gap-3",
  mobileCloseButton: "p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer",
  
  mobileMenuList: "space-y-1 p-3",
  mobileMenuItem: {
    base: "flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-xs cursor-pointer transition-colors",
    active: "text-teal-600 dark:text-teal-400 bg-teal-500/10 font-bold border border-teal-500/20",
    inactive: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
  },
  
  mobileFooter: "border-t border-slate-100 dark:border-slate-800 p-4",
  mobileFooterLink: "flex items-center gap-3 py-2.5 px-4 font-semibold text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer",
  mobileLogoutButton: "flex items-center gap-3 py-2.5 px-4 font-bold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl w-full cursor-pointer",
  
  mobileMenuButton: "lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-teal-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer font-bold"
};

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const styles = {
  layout: {
    root: "min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors",
    mainContainer: (sidebarCollapsed) => 
      `p-4 md:p-6 lg:p-8 pt-6 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`,
  },

  header: {
    container: "flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4",
    title: "text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight",
    subtitle: "text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium",
  },

  statCards: {
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6",
    card: "bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-800",
    cardHeader: "flex justify-between items-start",
    cardTitle: "text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400",
    cardValue: "text-2xl font-extrabold text-slate-900 dark:text-white mt-1",
    iconContainer: (color) => `p-2.5 rounded-xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 shrink-0`,
    icon: (color) => `w-5 h-5 text-${color}-600 dark:text-${color}-400`,
    cardFooter: "text-xs font-medium text-slate-500 dark:text-slate-400 mt-2",
  },

  grid: {
    main: "grid grid-cols-1 lg:grid-cols-3 gap-6",
    leftColumn: "lg:col-span-2 space-y-6",
    rightColumn: "lg:col-span-1 space-y-6",
  },

  cards: {
    base: "bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800",
    header: "flex justify-between items-center mb-6",
    title: "text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3",
    titleIcon: "w-5 h-5 text-teal-500",
  },

  transactions: {
    cardHeader: "flex justify-between items-center mb-4",
    cardTitle: "text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5",
    refreshButton: "p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer",
    refreshIcon: (loading) => `w-4 h-4 ${loading ? 'animate-spin' : ''}`,
    dataStackingInfo: "flex items-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 mb-4 bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20",
    dataStackingIcon: "w-4 h-4 shrink-0",
    listContainer: "space-y-3 max-h-[500px] overflow-y-auto pr-1",
    transactionItem: "flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors border border-slate-200/60 dark:border-slate-800/60",
    iconWrapper: (type) => type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    icon: "w-4 h-4",
    details: "min-w-0 flex-1 ml-3",
    description: "font-bold text-slate-900 dark:text-white text-xs md:text-sm truncate",
    meta: "text-[10px] text-slate-500 dark:text-slate-400 mt-0.5",
    amount: (type) => `font-extrabold text-xs md:text-sm ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`,
    emptyState: "text-center py-10",
    emptyIconContainer: "w-14 h-14 mx-auto mb-3 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center",
    emptyIcon: "w-7 h-7",
    emptyText: "text-slate-600 dark:text-slate-400 font-semibold text-xs",
    viewAllContainer: "pt-4 border-t border-slate-100 dark:border-slate-800",
    viewAllButton: "w-full flex items-center justify-center gap-2 py-2.5 text-teal-600 dark:text-teal-400 font-semibold text-xs hover:bg-teal-500/10 rounded-xl transition-colors cursor-pointer",
  },

  categories: {
    title: "text-base font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2.5",
    titleIcon: "w-5 h-5 text-cyan-500",
    list: "space-y-3.5",
    categoryItem: "flex items-center justify-between text-xs font-semibold",
    categoryIconContainer: "bg-teal-500/10 text-teal-600 dark:text-teal-400 p-2 rounded-xl flex items-center justify-center w-8 h-8 shrink-0",
    categoryIcon: "w-4 h-4",
    categoryName: "font-semibold text-slate-700 dark:text-slate-300 ml-2.5 flex-1",
    categoryAmount: "font-extrabold text-slate-900 dark:text-white",
    summaryContainer: "mt-6 pt-5 border-t border-slate-100 dark:border-slate-800",
    summaryGrid: "grid grid-cols-2 gap-3",
    summaryIncomeCard: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5",
    summaryExpenseCard: "bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5",
    summaryTitle: "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
    summaryValue: "text-sm font-black text-slate-900 dark:text-white mt-1",
  },

  colors: {
    transaction: {
      text: (type) => (type === 'income' || type === 'borrow') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      bg: (type) => (type === 'income' || type === 'borrow') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600',
    },
    expenseChange: (change) => change > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
  },
};

export const borrowLendStyles = {
  container: "space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8",
  headerContainer: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",
  title: "text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5",
  subtitle: "text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400",
  tabContainer: "flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2",
  tabButton: (isActive) => `px-5 py-2.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
    isActive 
      ? "border-teal-500 text-teal-600 dark:text-teal-400" 
      : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
  }`,
  statsGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6",
  statCard: "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm",
  statTitle: "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
  statVal: "text-xl font-extrabold text-slate-900 dark:text-white mt-1",
  statIcon: (color) => `p-2.5 rounded-xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 shrink-0`,
  actionBar: "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shadow-sm",
  statusBadge: (status) => {
    switch (status) {
      case 'settled':
        return "px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case 'partially_paid':
        return "px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      default:
        return "px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
    }
  },
  overdueBadge: "px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse inline-block mt-1",
  dueSoonBadge: "px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-block mt-1",
  cardList: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5",
  itemCard: "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden",
  cardHeader: "flex justify-between items-start mb-3",
  personName: "text-base font-bold text-slate-900 dark:text-white truncate",
  amountLabel: "text-[10px] font-bold uppercase tracking-wider text-slate-400",
  amountVal: "text-xl font-black text-slate-900 dark:text-white",
  remainingVal: "text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5",
  description: "text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 min-h-[36px]",
  metaInfo: "flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-4",
  repaymentItem: "flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold",
  repaymentNotes: "text-[10px] text-slate-400 block mt-0.5"
};

export const challengeStyles = {
  container: "space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8",
  header: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",
  title: "text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5",
  subtitle: "text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1",
  grid: "grid grid-cols-1 md:grid-cols-3 gap-5",
  card: "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden",
  cardHeader: "flex justify-between items-start mb-3",
  cardTitle: "text-base font-bold text-slate-900 dark:text-white truncate",
  cardDesc: "text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]",
  streakBadge: "flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20",
  progressContainer: "space-y-1.5 my-4",
  progressBar: "w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden",
  progressFill: (color) => `h-full rounded-full transition-all duration-500 ${color}`,
  progressText: "text-[10px] font-bold text-slate-500 dark:text-slate-400 flex justify-between uppercase tracking-wider",
  badgeShowcase: "grid grid-cols-2 md:grid-cols-5 gap-4",
  badgeCard: (earned) => `bg-white dark:bg-slate-900 border rounded-2xl p-4 text-center flex flex-col items-center justify-center transition-all ${
    earned 
      ? 'border-teal-500/30 bg-teal-500/5 text-teal-600 dark:text-teal-400 shadow-sm' 
      : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 grayscale opacity-60'
  }`,
  badgeName: "text-xs font-bold mt-2",
  badgeDesc: "text-[10px] text-slate-400 mt-0.5"
};