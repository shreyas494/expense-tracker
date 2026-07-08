import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  createChallenge,
  getChallenges,
  deleteChallenge,
} from "../controllers/challengeController.js";

const router = express.Router();

router.post("/create", authMiddleware, createChallenge);
router.get("/list", authMiddleware, getChallenges);
router.delete("/:challengeId", authMiddleware, deleteChallenge);

export default router;
