// src/routes/transaction.routes.ts
import { Router } from "express";
import { deleteTransactionHandler, editTransactionHandler, getTransactionsHandler, processAndSaveTransaction, processOcrTransaction } from "../controllers/transaction.controller.js";
import { requireAuth } from "@/middlewares/auth.middleware.js";
import { validateBody, validateQuery } from "@/middlewares/validation.middleware.js";
import { editTransactionSchema, getTransactionsQuerySchema } from "@/validation/transaction.validation.js";
import { upload } from "@/middlewares/upload.middleware.js";

const router = Router();

router.get("/", requireAuth, validateQuery(getTransactionsQuerySchema), getTransactionsHandler);
router.post("/parse", requireAuth, processAndSaveTransaction);
router.post("/parse-ocr", requireAuth, upload.single("receipt"), processOcrTransaction);
router.put("/:id", requireAuth, validateBody(editTransactionSchema), editTransactionHandler);
router.delete("/:id", requireAuth, deleteTransactionHandler);

export default router;