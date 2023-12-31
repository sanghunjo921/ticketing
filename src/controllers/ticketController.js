import { logger } from "../middlewares/logger";
import { Ticket } from "../models/Ticket";
import { redisService } from "../services/RedisService";

export const ticketController = {
  getAllTickets: async (req, res, next) => {
    try {
      logger.info("Request received for getAllTickets");
      logger.info("started getting tickets from redis");

      let tickets = JSON.parse(await redisService.getValue("tickets"));

      logger.info("ended getting tickets from redis");

      if (!tickets) {
        logger.info("started db access");
        tickets = await Ticket.findAll();
        logger.info("ended db access");

        if (tickets) {
          logger.info("started setting tickets on redis");
          redisService.setValue("tickets", JSON.stringify(tickets));
          logger.info("finished setting tickets on redis");
        } else {
          logger.error("Error fetching tickets from the database");
        }
      }

      res.json({
        message: "showing all tickets",
        data: {
          tickets,
        },
      });
    } catch (error) {
      logger.error("Error in getAllTickets:", error);
      next(error);
    }
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
    const tickets = JSON.parse(await redisService.getValue("tickets"));
    if (!tickets) {
      redisService.setValue("tickets", JSON.stringify([ticket]));
    } else {
      tickets.push(ticket);
      redisService.setValue("tickets", JSON.stringify(tickets));
    }
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
    const updatedTicket = await targetTicket.update(
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

    let tickets = JSON.parse(await redisService.getValue("tickets"));
    // console.log("Ticket IDs in the array:");
    // for (let i = 0; i < tickets.length; i++) {
    //   console.log(tickets[i].id);
    // }

    const targetId = parseInt(req.params.id, 10);

    let updatedIndex = -1;
    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i].id === targetId) {
        updatedIndex = i;
        break; // Exit the loop when the target element is found
      }
    }

    // console.log(`Updated Index: ${updatedIndex}`);

    if (updatedIndex !== -1) {
      tickets[updatedIndex] = updatedTicket;
    } else {
      console.log("Ticket not found.");
    }

    // console.log(tickets[updatedIndex]);

    redisService.setValue("tickets", JSON.stringify(tickets));

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

    const tickets = JSON.parse(await redisService.getValue("tickets"));
    // console.log(tickets);
    const updatedTickets = tickets.filter((ticket) => {
      return ticket.id !== parseInt(req.params.id, 10);
    });

    await redisService.setValue("tickets", JSON.stringify(updatedTickets));

    res.json({
      data: {
        message: "deleted",
      },
    });
  },
};
