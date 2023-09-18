import { Sequelize } from "sequelize";
import { sequelize } from "../db/postgres";

export const Ticket = sequelize.define("Ticket", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: Sequelize.STRING,
  description: Sequelize.TEXT,
  status: { type: Sequelize.ENUM, values: ["Available", "Sold Out"] },
  price: Sequelize.INTEGER,
  discountedPrice: Sequelize.INTEGER,
  remaining_number: Sequelize.INTEGER,
});
