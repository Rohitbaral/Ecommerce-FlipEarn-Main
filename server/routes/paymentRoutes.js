import express from "express";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../controllers/paymentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const paymentRouter = express.Router();

// Public routes (protect verification)
paymentRouter.post("/khalti-initiate", protect, initiateKhaltiPayment);
paymentRouter.post("/khalti-verify", verifyKhaltiPayment);

export default paymentRouter;
