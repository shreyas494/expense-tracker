import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
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

  // Consistent branding colors matching the project: Teal, Cyan, Orange/Rose
  const primaryColor = "#0d9488"; // Teal 600
  const secondaryColor = "#0891b2"; // Cyan 600
  const textColor = "#1e293b"; // Slate 800
  const mutedTextColor = "#64748b"; // Slate 500
  const gridBorderColor = "#e2e8f0"; // Slate 200

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
  // Box 1: Total Income (Teal styling)
  doc.fillColor("#f0fdfa"); // light teal
  doc.rect(50, 165, 155, 60).fill();
  doc.fillColor("#0d9488").font("Helvetica-Bold").fontSize(10).text("TOTAL INCOME", 60, 175);
  doc.fontSize(16).text(`₹${totalIncome.toFixed(2)}`, 60, 195);

  // Box 2: Total Expenses (Orange styling)
  doc.fillColor("#fff7ed"); // light orange
  doc.rect(215, 165, 155, 60).fill();
  doc.fillColor("#ea580c").font("Helvetica-Bold").fontSize(10).text("TOTAL EXPENSES", 225, 175);
  doc.fontSize(16).text(`₹${totalExpense.toFixed(2)}`, 225, 195);

  // Box 3: Net Savings (Cyan or Red styling)
  const savingsColor = savings >= 0 ? "#0891b2" : "#dc2626";
  doc.fillColor(savings >= 0 ? "#ecfeff" : "#fef2f2"); // light cyan or light red
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

    // Header Background: Primary Teal color with White text
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
          if (cell.startsWith("+")) doc.fillColor("#0d9488"); // Teal
          else if (cell.startsWith("-")) doc.fillColor("#ea580c"); // Orange
          else doc.fillColor(textColor);
        } else if (headers[cellIndex] === "Status") {
          if (cell === "settled" || cell === "completed") doc.fillColor("#0d9488"); // Teal
          else if (cell === "failed") doc.fillColor("#dc2626"); // Red
          else doc.fillColor("#ea580c"); // Orange
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
async function generateExcelReport(res, timeframe, dateRangeStr, data) {
  const { incomes, expenses, borrowLends, challenges } = data;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TrackExpense";
  workbook.created = new Date();

  // Helper to format worksheet headers
  function formatSheetHeaders(sheet, columns) {
    sheet.columns = columns;
    const headerRow = sheet.getRow(1);
    headerRow.height = 25;
    headerRow.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    
    // Teal background for headers matching the theme
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0D9488" }
    };
    
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    sheet.views = [{ showGridLines: true }];
  }

  // 1. Sheet: Summary Overview
  const summarySheet = workbook.addWorksheet("Summary Overview");
  summarySheet.views = [{ showGridLines: true }];

  summarySheet.getCell("A1").value = "TrackExpense Financial Summary";
  summarySheet.getCell("A1").font = { name: "Arial", size: 16, bold: true, color: { argb: "FF0D9488" } };
  summarySheet.mergeCells("A1:C1");
  summarySheet.getRow(1).height = 30;

  summarySheet.getCell("A2").value = `Period: ${timeframe.toUpperCase()}`;
  summarySheet.getCell("A2").font = { name: "Arial", size: 10, italic: true };
  summarySheet.getCell("A3").value = `Date Range: ${dateRangeStr}`;
  summarySheet.getCell("A3").font = { name: "Arial", size: 10, italic: true };

  // Financial Metrics Table
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;

  let totalBorrowed = 0;
  let totalLent = 0;
  borrowLends.forEach(b => {
    if (b.type === "borrow") totalBorrowed += b.remainingAmount;
    else totalLent += b.remainingAmount;
  });

  const summaryRows = [
    ["Metric", "Value", "Notes"],
    ["Total Income", totalIncome, "All earnings in this period"],
    ["Total Expenses", totalExpense, "All expenditures in this period"],
    ["Net Savings", netSavings, "Total savings (Income - Expenses)"],
    ["Total Borrowed (Outstanding)", totalBorrowed, "Money you owe to others"],
    ["Total Lent (Outstanding)", totalLent, "Money others owe to you"]
  ];

  summaryRows.forEach((row, i) => {
    const rowNum = i + 5;
    summarySheet.getRow(rowNum).values = row;
    if (i === 0) {
      const header = summarySheet.getRow(rowNum);
      header.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0D9488" } };
      header.height = 22;
    } else {
      const dataRow = summarySheet.getRow(rowNum);
      dataRow.getCell(2).numFmt = '"₹"#,##0.00';
      if (row[0] === "Net Savings") {
        dataRow.getCell(2).font = { bold: true, color: { argb: netSavings >= 0 ? "FF0D9488" : "FFDC2626" } };
      }
    }
  });

  summarySheet.getColumn(1).width = 30;
  summarySheet.getColumn(2).width = 18;
  summarySheet.getColumn(3).width = 35;

  // 2. Sheet: Incomes
  const incomesSheet = workbook.addWorksheet("Incomes");
  formatSheetHeaders(incomesSheet, [
    { header: "Date", key: "date", width: 15 },
    { header: "Category", key: "category", width: 18 },
    { header: "Description", key: "description", width: 35 },
    { header: "Amount", key: "amount", width: 18, style: { numFmt: '"₹"#,##0.00' } }
  ]);
  incomes.forEach(i => {
    incomesSheet.addRow({
      date: new Date(i.date).toLocaleDateString(),
      category: i.category || "",
      description: i.description || "",
      amount: Number(i.amount)
    });
  });

  // 3. Sheet: Expenses
  const expensesSheet = workbook.addWorksheet("Expenses");
  formatSheetHeaders(expensesSheet, [
    { header: "Date", key: "date", width: 15 },
    { header: "Category", key: "category", width: 18 },
    { header: "Description", key: "description", width: 35 },
    { header: "Amount", key: "amount", width: 18, style: { numFmt: '"₹"#,##0.00' } }
  ]);
  expenses.forEach(e => {
    expensesSheet.addRow({
      date: new Date(e.date).toLocaleDateString(),
      category: e.category || "",
      description: e.description || "",
      amount: Number(e.amount)
    });
  });

  // 4. Sheet: Borrow & Lend
  const borrowSheet = workbook.addWorksheet("Borrow & Lend");
  formatSheetHeaders(borrowSheet, [
    { header: "Date", key: "date", width: 15 },
    { header: "Type", key: "type", width: 12 },
    { header: "Person", key: "person", width: 20 },
    { header: "Total Amount", key: "amount", width: 18, style: { numFmt: '"₹"#,##0.00' } },
    { header: "Remaining Amount", key: "remainingAmount", width: 18, style: { numFmt: '"₹"#,##0.00' } },
    { header: "Due Date", key: "dueDate", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Description", key: "description", width: 30 }
  ]);
  borrowLends.forEach(b => {
    borrowSheet.addRow({
      date: new Date(b.date).toLocaleDateString(),
      type: b.type.toUpperCase(),
      person: b.person,
      amount: Number(b.amount),
      remainingAmount: Number(b.remainingAmount),
      dueDate: b.dueDate ? new Date(b.dueDate).toLocaleDateString() : "",
      status: b.status,
      description: b.description || ""
    });
  });

  // 5. Sheet: Savings Challenges
  const challengesSheet = workbook.addWorksheet("Savings Challenges");
  formatSheetHeaders(challengesSheet, [
    { header: "Title", key: "title", width: 25 },
    { header: "Description", key: "description", width: 30 },
    { header: "Type", key: "challengeType", width: 20 },
    { header: "Target Value", key: "targetValue", width: 18, style: { numFmt: '"₹"#,##0.00' } },
    { header: "Progress", key: "progress", width: 12 },
    { header: "Streak", key: "streak", width: 12 },
    { header: "Max Streak", key: "maxStreak", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Start Date", key: "startDate", width: 15 },
    { header: "End Date", key: "endDate", width: 15 }
  ]);
  challenges.forEach(c => {
    challengesSheet.addRow({
      title: c.title,
      description: c.description || "",
      challengeType: c.challengeType.replace("_", " ").toUpperCase(),
      targetValue: Number(c.targetValue),
      progress: c.progress,
      streak: `${c.streak} days`,
      maxStreak: `${c.maxStreak} days`,
      status: c.status,
      startDate: new Date(c.startDate).toLocaleDateString(),
      endDate: new Date(c.endDate).toLocaleDateString()
    });
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="TrackExpense_${timeframe}_Report_${dateRangeStr.replace(/[^a-zA-Z0-9-]/g, "_")}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
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
      await generateExcelReport(res, timeframe, dateRangeStr, data);
    } else {
      generatePdfReport(res, user, timeframe, dateRangeStr, data);
    }
  } catch (error) {
    console.error("ExportReport error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report" });
  }
}
