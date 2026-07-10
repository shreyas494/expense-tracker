import express from 'express';
import authMiddleware from '../middleware/auth.js';
import expenseModel from '../models/expenseModel.js';
import {
  addExpense,
  deleteExpense,
  downloadExpenseExcel,
  getAllExpense,
  getExpenseOverview,
  updateExpense,
  addSmsTransaction,
  getPendingNotes,
  updateSmsTransactionNote
} from '../controllers/expenseController.js';

const expenseRouter = express.Router();

expenseRouter.post("/add",authMiddleware,addExpense);
expenseRouter.get("/get",authMiddleware,getAllExpense);

expenseRouter.put("/update/:id",authMiddleware,updateExpense);
expenseRouter.get("/downloadexcel",authMiddleware,downloadExpenseExcel);

expenseRouter.delete("/delete/:id",authMiddleware,deleteExpense);
expenseRouter.get("/overview",authMiddleware,getExpenseOverview);

// SMS Webhook Routes
expenseRouter.post("/sms-webhook", addSmsTransaction);
expenseRouter.get("/pending-notes", authMiddleware, getPendingNotes);
expenseRouter.put("/update-sms-note/:id", authMiddleware, updateSmsTransactionNote);

export default expenseRouter;