import express from "express";
import { couponController } from "../controllers/couponController";

export const couponRouter = express.Router();

couponRouter.get("/coupons", couponController.getAllCoupons);
couponRouter.post("/coupons", couponController.createCoupon);
