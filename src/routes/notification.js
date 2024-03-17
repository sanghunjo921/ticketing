import express from "express";
import { notificationController } from "../controllers/notificationController";

export const notificationRouter = express.Router();

notificationRouter.post(
  "/notification",
  notificationController.createNotification
);
