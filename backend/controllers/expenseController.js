import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dateFilter.js";
import XLSX from "xlsx";
import incomeModel from "../models/incomeModel.js";


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

// Regex parsing function for standard Indian bank SMS transaction alerts
function parseTransactionSMS(text) {
  const textLower = text.toLowerCase();
  let type = "expense";
  
  // Detect if credited/received/deposited/added/refunded
  if (
    textLower.includes("credited") || 
    textLower.includes("received") || 
    textLower.includes("deposited") || 
    textLower.includes("added to") ||
    textLower.includes("refunded")
  ) {
    type = "income";
  }

  // Regex to extract amount (looks for Rs, INR, Re, ₹ followed by number)
  const amountRegex = /(?:rs\.?|inr|re\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
  const match = text.match(amountRegex);
  let amount = 0;
  if (match && match[1]) {
    amount = parseFloat(match[1].replace(/,/g, ""));
  }

  // Regex to extract merchant/recipient
  let description = "SMS Transaction";
  const merchantRegex = /(?:at|to|vpa|info|sent to|from)\s+([a-zA-Z0-9\s\.\*\/&_-]+?)(?:\s+on|\s+ref|\s+link|\s+balance|\.|$)/i;
  const merchMatch = text.match(merchantRegex);
  if (merchMatch && merchMatch[1]) {
    description = merchMatch[1].trim();
  } else {
    // Fallback: extract the first few words of the SMS as description
    description = text.substring(0, 30).trim() + "...";
  }

  return { type, amount, description };
}

// Controller for SMS Webhook
export async function addSmsTransaction(req, res) {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId query parameter is required" });
  }

  // Support typical fields that SMS Forwarder apps send
  const smsText = req.body.text || req.body.body || req.body.message || req.body.content;
  
  if (!smsText) {
    return res.status(400).json({ success: false, message: "No SMS body text provided in request payload" });
  }

  try {
    const { type, amount, description } = parseTransactionSMS(smsText);

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: "Parsed amount is zero or invalid" });
    }

    let result;
    if (type === "income") {
      result = new incomeModel({
        userId,
        amount,
        description: `SMS: ${description}`,
        category: "Other",
        date: new Date(),
        needsNote: true
      });
    } else {
      result = new expenseModel({
        userId,
        amount,
        description: `SMS: ${description}`,
        category: "Other",
        date: new Date(),
        needsNote: true
      });
    }

    await result.save();
    res.status(201).json({ success: true, message: "SMS transaction logged", data: result });
  } catch (error) {
    console.error("addSmsTransaction error:", error);
    res.status(500).json({ success: false, message: "Server error logging SMS transaction" });
  }
}

// Controller to get transactions that need notes
export async function getPendingNotes(req, res) {
  const userId = req.user._id;

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

// Controller to update note/category
export async function updateSmsTransactionNote(req, res) {
  const { id } = req.params;
  const userId = req.user._id;
  const { description, category, type } = req.body;

  if (!description || !category || !type) {
    return res.status(400).json({ success: false, message: "Description, category, and type are required" });
  }

  try {
    let transaction;
    if (type === "income") {
      transaction = await incomeModel.findOneAndUpdate(
        { _id: id, userId },
        { description, category, needsNote: false },
        { new: true }
      );
    } else {
      transaction = await expenseModel.findOneAndUpdate(
        { _id: id, userId },
        { description, category, needsNote: false },
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