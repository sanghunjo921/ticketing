import { Ticket } from "../models/Ticket";
import { redisService } from "../services/RedisService";

export const ticketController = {
  getAllTickets: async (req, res) => {
    console.log("ticket info from redis");
    let tickets = JSON.parse(await redisService.getValue("tickets"));
    if (!tickets) {
      tickets = await Ticket.findAll();
      redisService.setValue("tickets", JSON.stringify(tickets));
    }
    res.json({
      messge: "showing all tickets",
      data: {
        tickets,
      },
    });
  },

  getTicketsById: async (req, res) => {
    const ticket = await Ticket.findByPk(req.params.id);

    if (!ticket) {
      return res.status(404).json({ messge: "a ticket not found" });
    }
    res.json({
      message: "a target ticket is found",
      data: {
        ticket,
      },
    });
  },

  createTicket: async (req, res) => {
    const {
      title,
      description,
      status,
      price,
      discountedPrice,
      remaining_number,
    } = req.body;
    const ticket = await Ticket.create({
      title,
      description,
      status,
      price,
      discountedPrice,
      remaining_number,
    });
    res.json({
      message: "new ticket is created",
      data: {
        ticket,
      },
    });
  },

  updateTicketById: async (req, res) => {
    const {
      title,
      description,
      status,
      price,
      discountedPrice,
      remaining_number,
    } = req.body;

    const targetTicket = await Ticket.findOne({
      where: {
        id: req.params.id,
      },
    });

    if (!targetTicket) {
      return res.status(404).json({ messge: "ticket not found" });
    }
    const updatedTicket = await Ticket.update(
      {
        title,
        description,
        status,
        price,
        discountedPrice,
        remaining_number,
      },
      {
        where: {
          id: req.params.id,
        },
      }
    );

    res.json({
      message: "target updated successfully",
      data: {
        updatedTicket,
      },
    });
  },

  deleteTicketById: async (req, res) => {
    await Ticket.destroy({
      where: {
        id: req.params.id,
      },
    });
    res.json({
      data: {
        message: "deleted",
      },
    });
  },
};
