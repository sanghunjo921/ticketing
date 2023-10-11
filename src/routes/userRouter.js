import express from "express";
import { userController } from "../controllers/userController";
import { authenticated } from "../middlewares/auth";

export const userRouter = express.Router();

userRouter.post("/signup", userController.signUp);
userRouter.put("/signin", userController.signIn);
userRouter.get("/profile", authenticated, userController.getProfile);

userRouter.get("/users", userController.getAllUsersWithCoupons);
userRouter.get("/users/:id", userController.getUserById);
userRouter.post("/users/:id/coupon", userController.giveCouponToUser);
userRouter.post("/users/:id/ticket", userController.reserveTicket);

userRouter.get("/users/:id/purchases", userController.getPurchaseHistory);
userRouter.post(
  "/users/:id/tickets/:ticketId/purchase/",
  userController.buyTicketById
);

userRouter.patch("/users/:id/membership", userController.updateMembershipLevel);
