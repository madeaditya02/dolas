import { Router } from "express";
import { getDashboardData } from "../controllers/dashboard.controller.js";
import { requireAuth } from "@/middlewares/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getDashboardData);

export default router;