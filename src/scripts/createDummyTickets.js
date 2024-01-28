import { sequelize } from "../db/postgres";
import { Ticket } from "../models/Ticket";
import { redisService } from "../services/RedisService";

const dummyTickets = [];

for (let i = 1; i <= 1000; i++) {
  dummyTickets.push({
    title: `Ticket ${i}`,
    description: `Description for Ticket ${i}`,
    status: "Available",
    price: Math.floor(Math.random() * 100) + 50, //
    discountedPrice: i,
    remaining_number: Math.floor(Math.random() * 100) + 1,
  });
}

export const createDummyTickets = async () => {
  try {
    await Ticket.sync();
    console.log("created");

    await Ticket.bulkCreate(dummyTickets);

    const tickets = await Ticket.findAll();
    redisService.setValue("tickets", JSON.stringify(tickets));

    console.log("1,000 dummy tickets created successfully.");
  } catch (error) {
    console.error("Error creating dummy tickets:", error);
  } finally {
    await sequelize.close();
  }
};
