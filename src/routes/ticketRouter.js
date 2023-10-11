import express from "express";
import { ticketController } from "../controllers/ticketController";
import { authorized } from "../middlewares/auth";

export const ticketRouter = express.Router();

ticketRouter.get("/", ticketController.getAllTickets);
ticketRouter.get("/:id", ticketController.getTicketsById);
ticketRouter.post("/", authorized, ticketController.createTicket);
ticketRouter.delete("/:id", authorized, ticketController.deleteTicketById);
ticketRouter.put("/:id", authorized, ticketController.updateTicketById);
