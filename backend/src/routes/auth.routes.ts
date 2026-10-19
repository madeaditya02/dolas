import { Router } from "express";
import { register, verifyEmail, getVerifyToken, login, setupAccount, getUser, updateDailyLimit, updateProfile, updatePassword } from "../controllers/auth.controller.js";
import { requireAuth } from "@/middlewares/auth.middleware.js";
import { validateBody } from "@/middlewares/validation.middleware.js";
import { dailyLimitSchema, loginSchema, registerSchema, setupAccountSchema, updatePasswordSchema, updateProfileSchema } from "@/validation/auth.validation.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", getVerifyToken);
router.post("/login", validateBody(loginSchema), login);

router.get("/me", requireAuth, getUser);
router.post("/setup", requireAuth, validateBody(setupAccountSchema), setupAccount);
router.post("/daily-limit", requireAuth, validateBody(dailyLimitSchema), updateDailyLimit);
router.post("/profile", requireAuth, validateBody(updateProfileSchema), updateProfile);
router.post("/password", requireAuth, validateBody(updatePasswordSchema), updatePassword);

export default router;