import express from "express";
import { exportReport } from "../controllers/reportController.js";
import authMiddleware from "../middleware/auth.js";

const reportRouter = express.Router();

// Get export report route
reportRouter.get("/export", authMiddleware, exportReport);

export default reportRouter;
