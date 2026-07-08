import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  addBorrowLend,
  getAllBorrowLend,
  updateBorrowLend,
  deleteBorrowLend,
  addRepayment,
  deleteRepayment,
  getBorrowLendOverview,
} from '../controllers/borrowLendController.js';

const borrowLendRouter = express.Router();

borrowLendRouter.post("/add", authMiddleware, addBorrowLend);
borrowLendRouter.get("/get", authMiddleware, getAllBorrowLend);
borrowLendRouter.put("/update/:id", authMiddleware, updateBorrowLend);
borrowLendRouter.delete("/delete/:id", authMiddleware, deleteBorrowLend);

borrowLendRouter.post("/repayment/:id", authMiddleware, addRepayment);
borrowLendRouter.delete("/repayment/:id/:paymentId", authMiddleware, deleteRepayment);

borrowLendRouter.get("/overview", authMiddleware, getBorrowLendOverview);

export default borrowLendRouter;
