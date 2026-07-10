import PDFDocument from "pdfkit";
import XLSX from "xlsx";
import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";
import borrowLendModel from "../models/borrowLendModel.js";
import challengeModel from "../models/challengeModel.js";
import User from "../models/userModel.js";

// Helper to determine start and end dates based on timeframe and optional custom date
function getReportDateRange(timeframe, dateStr) {
  let targetDate = new Date();
  if (dateStr) {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    }
  }

  let start, end;
  if (timeframe === "daily") {
    start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
  } else if (timeframe === "weekly") {
    // Week starts on Sunday
    const day = targetDate.getDay();
    start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() - day, 0, 0, 0, 0);
    end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    // Monthly (default)
    start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
}

// Generate PDF Report
function generatePdfReport(res, user, timeframe, dateRangeStr, data) {
  const { incomes, expenses, borrowLends, challenges } = data;
  const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="TrackExpense_${timeframe}_Report_${dateRangeStr.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf"`
  );

  doc.pipe(res);

  // Styling helper values
  const primaryColor = "#0f172a";
  const secondaryColor = "#4f46e5";
  const textColor = "#1e293b";
  const mutedTextColor = "#64748b";
  const gridBorderColor = "#e2e8f0";

  // --- HEADER ---
  doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(26);
  doc.text("TrackExpense", 50, 45);
  doc.fillColor(secondaryColor).font("Helvetica").fontSize(10);
  doc.text("PERSONAL FINANCIAL REPORT", 50, 75);

  doc.strokeColor(gridBorderColor).lineWidth(1);
  doc.moveTo(50, 90).lineTo(545, 90).stroke();

  // User and Period Info
  doc.fillColor(textColor).font("Helvetica-Bold").fontSize(10);
  doc.text(`User: `, 50, 105, { continued: true });
  doc.font("Helvetica").text(`${user.name} (${user.email})`);
  
  doc.font("Helvetica-Bold").text(`Period: `, 50, 120, { continued: true });
  doc.font("Helvetica").text(`${timeframe.toUpperCase()} (${dateRangeStr})`);

  doc.font("Helvetica-Bold").text(`Generated At: `, 50, 135, { continued: true });
  doc.font("Helvetica").text(`${new Date().toLocaleString()}`);

  doc.strokeColor(gridBorderColor).lineWidth(1);
  doc.moveTo(50, 150).lineTo(545, 150).stroke();

  // --- METRICS SUMMARY ---
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const savings = totalIncome - totalExpense;
  
  let totalBorrowed = 0;
  let totalLent = 0;
  borrowLends.forEach(b => {
    if (b.type === "borrow") totalBorrowed += b.remainingAmount;
    else totalLent += b.remainingAmount;
  });

  // Render Metric Blocks (3 columns)
  // Box 1: Total Income
  doc.fillColor("#f0fdf4");
  doc.rect(50, 165, 155, 60).fill();
  doc.fillColor("#16a34a").font("Helvetica-Bold").fontSize(10).text("TOTAL INCOME", 60, 175);
  doc.fontSize(16).text(`₹${totalIncome.toFixed(2)}`, 60, 195);

  // Box 2: Total Expenses
  doc.fillColor("#fef2f2");
  doc.rect(215, 165, 155, 60).fill();
  doc.fillColor("#dc2626").font("Helvetica-Bold").fontSize(10).text("TOTAL EXPENSES", 225, 175);
  doc.fontSize(16).text(`₹${totalExpense.toFixed(2)}`, 225, 195);

  // Box 3: Net Savings
  const savingsColor = savings >= 0 ? "#16a34a" : "#dc2626";
  doc.fillColor(savings >= 0 ? "#f0fdf4" : "#fef2f2");
  doc.rect(380, 165, 165, 60).fill();
  doc.fillColor(savingsColor).font("Helvetica-Bold").fontSize(10).text("NET SAVINGS", 390, 175);
  doc.fontSize(16).text(`₹${savings.toFixed(2)}`, 390, 195);

  let currentY = 245;

  // Helper function to draw table
  function drawTable(doc, startY, title, headers, rows, colWidths) {
    if (startY > 680) {
      doc.addPage();
      startY = 50;
    }
    
    // Draw Section Title
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(14).text(title, 50, startY);
    let y = startY + 20;

    // Header Background
    doc.fillColor(primaryColor).rect(50, y, 495, 20).fill();
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);

    let x = 50;
    headers.forEach((h, index) => {
      doc.text(h, x + 5, y + 6, { width: colWidths[index] - 10, align: "left" });
      x += colWidths[index];
    });

    y += 20;
    doc.font("Helvetica").fontSize(8).fillColor(textColor);

    if (rows.length === 0) {
      doc.fillColor(mutedTextColor).text("No records found for this period.", 55, y + 6);
      y += 20;
      doc.strokeColor(gridBorderColor).lineWidth(0.5);
      doc.moveTo(50, y).lineTo(545, y).stroke();
      return y + 10;
    }

    rows.forEach((row, rowIndex) => {
      // Alternating rows
      if (rowIndex % 2 === 1) {
        doc.fillColor("#f8fafc").rect(50, y, 495, 18).fill();
      }

      x = 50;
      row.forEach((cell, cellIndex) => {
        // Alignment & color formatting for currencies or special flags
        if (headers[cellIndex] === "Amount" || headers[cellIndex] === "Repaid" || headers[cellIndex] === "Remaining") {
          if (cell.startsWith("+")) doc.fillColor("#16a34a");
          else if (cell.startsWith("-")) doc.fillColor("#dc2626");
          else doc.fillColor(textColor);
        } else if (headers[cellIndex] === "Status") {
          if (cell === "settled" || cell === "completed") doc.fillColor("#16a34a");
          else if (cell === "failed") doc.fillColor("#dc2626");
          else doc.fillColor("#d97706"); // pending/active: orange
        } else {
          doc.fillColor(textColor);
        }

        doc.text(cell.toString(), x + 5, y + 5, { width: colWidths[cellIndex] - 10, align: "left" });
        x += colWidths[cellIndex];
      });

      y += 18;

      // Draw bottom border
      doc.strokeColor(gridBorderColor).lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();

      // Page break check
      if (y > 700) {
        doc.addPage();
        y = 50;
        // Redraw table headers on new page
        doc.fillColor(primaryColor).rect(50, y, 495, 20).fill();
        doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
        let px = 50;
        headers.forEach((h, index) => {
          doc.text(h, px + 5, y + 6, { width: colWidths[index] - 10 });
          px += colWidths[index];
        });
        y += 20;
        doc.font("Helvetica").fontSize(8);
      }
    });

    return y + 15;
  }

  // --- SECTION: INCOME ---
  const incomeHeaders = ["Date", "Category", "Description", "Amount"];
  const incomeWidths = [80, 100, 215, 100];
  const incomeRows = incomes.map(i => [
    new Date(i.date).toLocaleDateString(),
    i.category || "",
    i.description || "",
    `+₹${Number(i.amount).toFixed(2)}`
  ]);
  currentY = drawTable(doc, currentY, "Incomes Log", incomeHeaders, incomeRows, incomeWidths);

  // --- SECTION: EXPENSES ---
  const expenseHeaders = ["Date", "Category", "Description", "Amount"];
  const expenseWidths = [80, 100, 215, 100];
  const expenseRows = expenses.map(e => [
    new Date(e.date).toLocaleDateString(),
    e.category || "",
    e.description || "",
    `-₹${Number(e.amount).toFixed(2)}`
  ]);
  currentY = drawTable(doc, currentY, "Expenses Log", expenseHeaders, expenseRows, expenseWidths);

  // --- SECTION: BORROW & LEND ---
  const borrowHeaders = ["Date", "Type", "Person", "Total", "Remaining", "Status"];
  const borrowWidths = [75, 60, 110, 80, 90, 80];
  const borrowRows = borrowLends.map(b => [
    new Date(b.date).toLocaleDateString(),
    b.type.toUpperCase(),
    b.person || "",
    `₹${Number(b.amount).toFixed(2)}`,
    `₹${Number(b.remainingAmount).toFixed(2)}`,
    b.status
  ]);
  currentY = drawTable(doc, currentY, "Borrow & Lend Ledger", borrowHeaders, borrowRows, borrowWidths);

  // --- SECTION: SAVINGS CHALLENGES ---
  const challengeHeaders = ["Title", "Type", "Target Value", "Progress", "Streak", "Status"];
  const challengeWidths = [120, 85, 80, 70, 60, 80];
  const challengeRows = challenges.map(c => [
    c.title,
    c.challengeType.replace("_", " ").toUpperCase(),
    `₹${c.targetValue}`,
    c.progress.toString(),
    `${c.streak} days`,
    c.status
  ]);
  currentY = drawTable(doc, currentY, "Savings Challenges", challengeHeaders, challengeRows, challengeWidths);

  // --- FOOTER AND PAGE NUMBERS ---
  // PDFKit bufferPages dynamic rendering
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor(mutedTextColor);
    doc.text(
      `TrackExpense Financial Report | Page ${i + 1} of ${range.count}`,
      50,
      780,
      { align: "center", width: 495 }
    );
  }

  doc.end();
}

// Generate Excel Report
function generateExcelReport(res, timeframe, dateRangeStr, data) {
  const { incomes, expenses, borrowLends, challenges } = data;
  const workbook = XLSX.utils.book_new();

  // 1. Sheet: Summary Overview
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;

  let totalBorrowed = 0;
  let totalLent = 0;
  borrowLends.forEach(b => {
    if (b.type === "borrow") totalBorrowed += b.remainingAmount;
    else totalLent += b.remainingAmount;
  });

  const summaryData = [
    { Metric: "Report Period", Value: timeframe.toUpperCase() },
    { Metric: "Date Range", Value: dateRangeStr },
    { Metric: "Generated At", Value: new Date().toLocaleString() },
    { Metric: "", Value: "" },
    { Metric: "Financial Totals", Value: "" },
    { Metric: "Total Income", Value: totalIncome },
    { Metric: "Total Expenses", Value: totalExpense },
    { Metric: "Net Savings", Value: netSavings },
    { Metric: "", Value: "" },
    { Metric: "Debts & Loans Summary", Value: "" },
    { Metric: "Total Borrowed Outstanding", Value: totalBorrowed },
    { Metric: "Total Lent Outstanding", Value: totalLent },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary Overview");

  // 2. Sheet: Incomes
  const incomesData = incomes.map(i => ({
    Date: new Date(i.date).toLocaleDateString(),
    Category: i.category || "",
    Description: i.description || "",
    Amount: Number(i.amount)
  }));
  const incomesSheet = XLSX.utils.json_to_sheet(incomesData);
  XLSX.utils.book_append_sheet(workbook, incomesSheet, "Incomes");

  // 3. Sheet: Expenses
  const expensesData = expenses.map(e => ({
    Date: new Date(e.date).toLocaleDateString(),
    Category: e.category || "",
    Description: e.description || "",
    Amount: Number(e.amount)
  }));
  const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, "Expenses");

  // 4. Sheet: Borrow & Lend
  const borrowLendData = borrowLends.map(b => ({
    Date: new Date(b.date).toLocaleDateString(),
    Type: b.type.toUpperCase(),
    Person: b.person,
    Amount: Number(b.amount),
    "Remaining Amount": Number(b.remainingAmount),
    "Due Date": b.dueDate ? new Date(b.dueDate).toLocaleDateString() : "",
    Status: b.status,
    Description: b.description || ""
  }));
  const borrowSheet = XLSX.utils.json_to_sheet(borrowLendData);
  XLSX.utils.book_append_sheet(workbook, borrowSheet, "Borrow & Lend");

  // 5. Sheet: Challenges
  const challengesData = challenges.map(c => ({
    Title: c.title,
    Description: c.description || "",
    Type: c.challengeType,
    "Target Value": Number(c.targetValue),
    Progress: c.progress,
    Streak: `${c.streak} days`,
    "Max Streak": `${c.maxStreak} days`,
    Status: c.status,
    "Start Date": new Date(c.startDate).toLocaleDateString(),
    "End Date": new Date(c.endDate).toLocaleDateString()
  }));
  const challengesSheet = XLSX.utils.json_to_sheet(challengesData);
  XLSX.utils.book_append_sheet(workbook, challengesSheet, "Savings Challenges");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="TrackExpense_${timeframe}_Report_${dateRangeStr.replace(/[^a-zA-Z0-9-]/g, "_")}.xlsx"`
  );
  res.send(buffer);
}

// Controller entry point
export async function exportReport(req, res) {
  const userId = req.user._id;
  const { timeframe = "monthly", format = "pdf", date } = req.query;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { start, end } = getReportDateRange(timeframe, date);
    const dateRangeStr = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;

    // Query all relevant transaction records
    const [incomes, expenses, borrowLends, challenges] = await Promise.all([
      incomeModel.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 }).lean(),
      expenseModel.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 }).lean(),
      borrowLendModel.find({ userId, date: { $gte: start, $lte: end } }).sort({ date: 1 }).lean(),
      challengeModel.find({
        userId,
        startDate: { $lte: end },
        endDate: { $gte: start }
      }).sort({ startDate: 1 }).lean(),
    ]);

    const data = { incomes, expenses, borrowLends, challenges };

    if (format === "excel") {
      generateExcelReport(res, timeframe, dateRangeStr, data);
    } else {
      generatePdfReport(res, user, timeframe, dateRangeStr, data);
    }
  } catch (error) {
    console.error("ExportReport error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report" });
  }
}
