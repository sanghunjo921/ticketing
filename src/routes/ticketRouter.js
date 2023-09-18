import express from "express";
import { ticketController } from "../controllers/ticketController";

export const ticketRouter = express.Router();

ticketRouter.get("/", ticketController.getAllTickets);
ticketRouter.get("/:id", ticketController.getTicketsById);
ticketRouter.post("/", ticketController.createTicket);
ticketRouter.delete("/:id", ticketController.deleteTicketById);
ticketRouter.put("/:id", ticketController.updateTicketById);
