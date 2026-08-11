import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dateFilter.js";
import XLSX from "xlsx";
import incomeModel from "../models/incomeModel.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

function resolveUserId(req) {
  if (req.user?._id) return req.user._id;
  if (req.user?.id) return req.user.id;
  if (req.query?.userId) return req.query.userId;
  if (req.body?.userId) return req.body.userId;

  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload?.id) return payload.id;
    } catch (e) {}
  }
  return null;
}

//add expense

export async function addExpense(req,res){
    const userId = req.user._id;
    const {description,amount,category,date} = req.body;

    try{
            if(!description || !amount || !category || !date)
            {
                return res.status(400).json({
                    success:false,
                    message:"all fields are required"
                });
            }
            const newExpense = new expenseModel({
                            userId,
                            description,
                            amount,
                            category,
                            date: new Date(date)
                        });
                        await newExpense.save();
                        res.json({
                            success:true,
                            message:"expense added successfully",
                        });
        }
        catch(error){
            console.log(error);
            res.status(500).json({
                success:false,
                message:"server error"
            });
        }

}

// to get all expenses
export async function getAllExpense(req,res){
    const userId=req.user._id;
    try{
            const expense = await expenseModel.find({userId}).sort({date:-1});
            res.json(expense);

    } catch(error){
            console.log(error);
            res.status(500).json({
                success:false,
                message:"server error"
            });
        }
}

//to update an expense
export async function updateExpense(req,res){
    const { id } = req.params;
    const userId=req.user._id;
    const {description,amount,category,date} = req.body;

    try{
        const updateFields = {};
        if (description !== undefined) updateFields.description = description;
        if (amount !== undefined) updateFields.amount = amount;
        if (category !== undefined) updateFields.category = category;
        if (date !== undefined) updateFields.date = new Date(date);

        const updatedExpense = await expenseModel.findOneAndUpdate(
            {_id:id,userId},
            updateFields,
            {new : true}
        );

        if(!updatedExpense)
        {
            return res.status(404).json({
                success:false,
                message:"expense not found"  
            })
        }
        res.json({success:true, message:"expense updated successfully",data:updatedExpense});
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"server error"
        });
    }
}

//delete an expense 
export async function deleteExpense(req,res){
    try{
            const expense=await expenseModel.findByIdAndDelete({_id:req.params.id});
            if(!expense)
            {
                return res.status(400).json({
                    success:false,
                    message:"expense not found"
                })
            }
            res.json({success:true,message:"expense deleted successfully"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"server error"
        });
    }
}

//download excel for expense
export async function downloadExpenseExcel(req,res){
     const userId = req.user._id;

    try{
        const expense = await expenseModel.find({userId}).sort({date:-1});
        const plainData = expense.map((exp) => ({
            Description : exp.description,
            Amount : exp.amount,
            Category : exp.category,
            Date : new Date(exp.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook=XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,worksheet,"expenseModel");
        XLSX.writeFile(workbook,"expense_details.xlsx");
        res.download("expense_details.xlsx")
    }

    catch(error)
    {
            console.log(error);
            res.status(500).json({
                success:false,
                message:"server error"
            });
    }
}


//to get an overview of expense
export async function getExpenseOverview(req,res){
     try{
                        const userId = req.user._id;
                        const {range = "monthly" } = req.query;
                        const {start,end} = getDateRange(range);

                        const expense = await expenseModel.find({
                            userId,
                            date:{ $gte: start, $lte:end},

                        }).sort({date:-1});
                        
 
                        const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
                        const averageExpense = expense.length > 0 ? totalExpense / expense.length : 0;
                        const numberOfTransactions = expense.length;
                    const recentTransactions = expense.slice(0, 5);

                    res.json({
                        success:true,
                        data:{
                            totalExpense,
                            averageExpense,
                            numberOfTransactions,
                            recentTransactions,
                            range
                        }
                    });
        }

         catch(error)
    {
            console.log(error);
            res.status(500).json({
                success:false,
                message:"server error"
            });
    }
}

// Regex parsing function for standard Indian bank SMS transaction alerts & PhonePe/GPay share texts
function parseTransactionSMS(text) {
  const textLower = text.toLowerCase();
  let type = "expense";
  
  // 1. Determine Type (Debit vs Credit)
  const hasCreditKeywords = 
    textLower.includes("credited") || 
    textLower.includes("received") || 
    textLower.includes("deposited") || 
    textLower.includes("added to") ||
    textLower.includes("refunded") ||
    textLower.includes("cr. to") ||
    textLower.includes("cr to");
    
  const hasDebitKeywords =
    textLower.includes("debited") ||
    textLower.includes("spent") ||
    textLower.includes("paid") ||
    textLower.includes("transferred") ||
    textLower.includes("withdrawn") ||
    textLower.includes("dr. from") ||
    textLower.includes("dr from");

  if (hasCreditKeywords && !textLower.includes("dr. from") && !textLower.includes("dr from")) {
    type = "income";
  } else if (hasCreditKeywords && hasDebitKeywords) {
    if (textLower.includes("cr. to a/c") || textLower.includes("cr to a/c") || textLower.includes("credited to a/c") || textLower.includes("credited to your a/c")) {
      type = "income";
    } else {
      type = "expense";
    }
  }

  // 2. Regex to extract amount (looks for Rs, INR, Re, ₹ followed by number)
  const amountRegex = /(?:rs\.?|inr|re\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const match = text.match(amountRegex);
  let amount = 0;
  if (match && match[1]) {
    amount = parseFloat(match[1].replace(/,/g, ""));
  }

  // 3. Extract Merchant / Recipient
  let description = "";
  // Check for PhonePe/GPay patterns like "Paid to Swiggy", "Sent to Rahul", "Paid Rs 1 to Uddesh"
  const upiRecipientMatch = text.match(/(?:paid to|sent to|paid|transfer to|to VPA|to merchant|vpa|info)\s+([a-zA-Z0-9\s\.\*\/&@_-]+?)(?:\s+on|\s+ref|\s+link|\s+via|\s+balance|\s+using|\.|$)/i);
  
  if (upiRecipientMatch && upiRecipientMatch[1]) {
    let rawMerchant = upiRecipientMatch[1].trim();
    // Clean up VPA handle if present (swiggy@icici -> Swiggy)
    if (rawMerchant.includes('@')) {
      rawMerchant = rawMerchant.split('@')[0];
    }
    // Remove noise words
    rawMerchant = rawMerchant.replace(/^(using|via|on|for)\s+/i, '').trim();
    if (rawMerchant.length > 1 && !rawMerchant.toLowerCase().includes('phonepe') && !rawMerchant.toLowerCase().includes('gpay')) {
      description = rawMerchant;
    }
  }

  if (!description) {
    // Fallback: extract merchant from text snippet
    const merchMatch = text.match(/(?:at|from)\s+([a-zA-Z0-9\s\.\*\/&@_-]+?)(?:\s+on|\s+ref|\.|$)/i);
    if (merchMatch && merchMatch[1]) {
      description = merchMatch[1].trim();
    }
  }

  // Final fallback if description is empty or generic promo text
  if (!description || description.toLowerCase().includes("explore the app") || description.toLowerCase().includes("download")) {
    description = "Payment Transaction";
  }

  // Capitalize clean description
  description = description.replace(/\s+/g, " ").trim();
  description = description.charAt(0).toUpperCase() + description.slice(1);

  // 4. Auto-Categorization Logic
  let category = type === "income" ? "Salary" : "Other";
  const descLower = description.toLowerCase();

  if (descLower.includes("swiggy") || descLower.includes("zomato") || descLower.includes("restaurant") || descLower.includes("cafe") || descLower.includes("food") || descLower.includes("kfc") || descLower.includes("mcdonald") || descLower.includes("starbucks") || descLower.includes("domino")) {
    category = "Food";
  } else if (descLower.includes("uber") || descLower.includes("ola") || descLower.includes("rapido") || descLower.includes("metro") || descLower.includes("petrol") || descLower.includes("fuel") || descLower.includes("shell") || descLower.includes("transport")) {
    category = "Transport";
  } else if (descLower.includes("amazon") || descLower.includes("flipkart") || descLower.includes("myntra") || descLower.includes("ajio") || descLower.includes("meesho") || descLower.includes("shopping") || descLower.includes("mart") || descLower.includes("bazaar")) {
    category = "Shopping";
  } else if (descLower.includes("bookmyshow") || descLower.includes("netflix") || descLower.includes("spotify") || descLower.includes("cinema") || descLower.includes("movie") || descLower.includes("game")) {
    category = "Entertainment";
  } else if (descLower.includes("recharge") || descLower.includes("jio") || descLower.includes("airtel") || descLower.includes("electricity") || descLower.includes("water") || descLower.includes("bill") || descLower.includes("broadband")) {
    category = "Utilities";
  } else if (descLower.includes("pharmacy") || descLower.includes("apollo") || descLower.includes("hospital") || descLower.includes("doctor") || descLower.includes("health") || descLower.includes("clinic")) {
    category = "Healthcare";
  } else if (descLower.includes("rent") || descLower.includes("society") || descLower.includes("maintenance") || descLower.includes("housing")) {
    category = "Housing";
  } else if (type === "income") {
    if (descLower.includes("freelance") || descLower.includes("upwork") || descLower.includes("fiverr")) category = "Freelance";
    else if (descLower.includes("dividend") || descLower.includes("interest") || descLower.includes("stock") || descLower.includes("invest")) category = "Investment";
    else if (descLower.includes("bonus") || descLower.includes("cashback") || descLower.includes("reward")) category = "Bonus";
  }

  return { type, amount, description, category };
}

// Controller for SMS / Web Share Target Webhook
export async function addSmsTransaction(req, res) {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter or authentication token is required" });
  }

  const smsText = req.body.text || req.body.body || req.body.message || req.body.content;
  
  if (!smsText) {
    return res.status(400).json({ success: false, message: "No transaction text provided in request payload" });
  }

  try {
    const { type, amount, description, category } = parseTransactionSMS(smsText);

    let result;
    if (type === "income") {
      result = new incomeModel({
        userId,
        amount: amount || 0,
        description: description,
        category: category || "Salary",
        date: new Date(),
        needsNote: true
      });
    } else {
      result = new expenseModel({
        userId,
        amount: amount || 0,
        description: description,
        category: category || "Other",
        date: new Date(),
        needsNote: true
      });
    }

    await result.save();
    res.status(201).json({ success: true, message: "Transaction logged successfully", data: result });
  } catch (error) {
    console.error("addSmsTransaction error:", error);
    res.status(500).json({ success: false, message: "Server error logging transaction" });
  }
}

// Controller to get transactions that need notes
export async function getPendingNotes(req, res) {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const [expenses, incomes] = await Promise.all([
      expenseModel.find({ userId, needsNote: true }).lean(),
      incomeModel.find({ userId, needsNote: true }).lean()
    ]);

    const allPending = [
      ...expenses.map(e => ({ ...e, type: "expense" })),
      ...incomes.map(i => ({ ...i, type: "income" }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: allPending });
  } catch (error) {
    console.error("getPendingNotes error:", error);
    res.status(500).json({ success: false, message: "Server error fetching pending notes" });
  }
}

// Controller to update note/amount/category
export async function updateSmsTransactionNote(req, res) {
  const { id } = req.params;
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  const { description, category, type, amount } = req.body;

  if (!description || !category || !type) {
    return res.status(400).json({ success: false, message: "Description, category, and type are required" });
  }

  try {
    const updateFields = { description, category, needsNote: false };
    if (amount != null && Number(amount) > 0) {
      updateFields.amount = Number(amount);
    }

    let transaction;
    if (type === "income") {
      transaction = await incomeModel.findOneAndUpdate(
        { _id: id, userId },
        updateFields,
        { new: true }
      );
    } else {
      transaction = await expenseModel.findOneAndUpdate(
        { _id: id, userId },
        updateFields,
        { new: true }
      );
    }

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    res.json({ success: true, message: "Transaction details updated", data: transaction });
  } catch (error) {
    console.error("updateSmsTransactionNote error:", error);
    res.status(500).json({ success: false, message: "Server error updating transaction details" });
  }
}

// Controller to scan image receipt/screenshot via Gemini API or fallback
export async function scanReceiptImage(req, res) {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId parameter or authentication token is required" });
  }

  const { imageBase64, mimeType = 'image/png' } = req.body;
  let extracted = { amount: 0, description: "Shared Payment Receipt", category: "Other", type: "expense" };

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (imageBase64 && apiKey) {
    try {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      let geminiRes = null;

      for (const model of models) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { inlineData: { mimeType, data: cleanBase64 } },
                    { text: 'Analyze this transaction screenshot carefully. Extract exact payment amount (number), type (expense or income), and recipient/merchant name string. Return ONLY raw JSON without markdown formatting: {"amount": 1, "type": "expense", "description": "recipient or merchant name", "category": "Food"|"Transport"|"Shopping"|"Utilities"|"Healthcare"|"Housing"|"Salary"|"Other"}' }
                  ]
                }]
              })
            }
          );
          if (r.ok) {
            geminiRes = r;
            break;
          }
        } catch (mErr) {
          console.error(`Gemini model ${model} error:`, mErr);
        }
      }

      if (geminiRes) {
        const jsonResult = await geminiRes.json();
        const rawText = jsonResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedJsonStr = rawText.replace(/```json|```/g, '').trim();
        const parsedAi = JSON.parse(cleanedJsonStr);

        if (parsedAi.amount != null && !isNaN(parsedAi.amount)) extracted.amount = Number(parsedAi.amount);
        if (parsedAi.description) extracted.description = String(parsedAi.description).trim();
        if (parsedAi.category) extracted.category = String(parsedAi.category).trim();
        if (parsedAi.type) extracted.type = String(parsedAi.type).trim();
      }
    } catch (gErr) {
      console.error("Gemini receipt scan error:", gErr);
    }
  }

  try {
    let result;
    if (extracted.type === "income") {
      result = new incomeModel({
        userId,
        amount: extracted.amount || 0,
        description: extracted.description,
        category: extracted.category || "Salary",
        date: new Date(),
        needsNote: true
      });
    } else {
      result = new expenseModel({
        userId,
        amount: extracted.amount || 0,
        description: extracted.description,
        category: extracted.category || "Other",
        date: new Date(),
        needsNote: true
      });
    }

    await result.save();
    res.status(201).json({ success: true, message: "Receipt transaction logged", data: result });
  } catch (err) {
    console.error("scanReceiptImage error:", err);
    res.status(500).json({ success: false, message: "Server error scanning receipt image" });
  }
}