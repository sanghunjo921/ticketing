import { Ticket } from "../models/Ticket";

export const ticketController = {
  getAllTickets: async (req, res) => {
    const tickets = await Ticket.findAll();
    res.json({
      messge: "Get all tickets",
      data: {
        tickets,
      },
    });
  },

  getTicketsById: (req, res) => {},

  createTicket: async (req, res) => {
    const { title, description, status, price, remaining_number } = req.body;
    const ticket = await Ticket.create({
      title,
      description,
      status,
      price,
      remaining_number,
    });
    res.json({
      message: "post creat ticket",
      data: {
        ticket,
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
