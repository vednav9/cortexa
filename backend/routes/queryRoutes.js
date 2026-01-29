import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getQueries,
  getQueryById,
  createQuery,
  addReply,
  updateQueryStatus,
  deleteQuery,
  getQueryStats
} from "../controllers/queryController.js";

const router = express.Router();

router.use(authenticate);

router.get("/institution/:institutionId", getQueries);
router.get("/institution/:institutionId/stats", getQueryStats);
router.post("/institution/:institutionId", createQuery);

router.get("/:queryId", getQueryById);
router.post("/:queryId/reply", addReply);
router.patch("/:queryId/status", updateQueryStatus);
router.delete("/:queryId", deleteQuery);

export default router;
