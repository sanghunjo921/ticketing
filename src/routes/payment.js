import express from "express";
import { paymentController } from "../controllers/paymentController";

export const paymentRouter = express.Router();

paymentRouter.post("/payment", paymentController.createPayment);
