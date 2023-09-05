import { Sequelize } from "sequelize";
import { sequelize } from "..";

const Ticket = sequelize.define("Ticket", {
  // Model attributes are defined here
  id: {
    type: Sequelize.UUID,
    autoIncrement: true,
    primaryKey: true,
  },
  title: Sequelize.STRING,
  description: Sequelize.TEXT,
  status: { type: Sequelize.ENUM, values: ["Available", "Sold Out"] },
  price: Sequelize.INTEGER,
  discountedPrice: Sequelize.INTEGER,
  created_date: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  updated_date: {
    allowNull: false,
    type: Sequelize.DATE,
  },
  remaining_number: Sequelize.INTEGER,
});
