import express from "express";
import { discountController } from "../controllers/discountController";

export const discountRateRouter = express.Router();

discountRateRouter.get(
  "/discountRates",
  discountController.getAllDiscountRates
);
