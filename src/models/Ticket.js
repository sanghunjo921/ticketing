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

export const User = sequelize.define("User", {
  // Model attributes are defined here
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: Sequelize.STRING,
  password: Sequelize.TEXT,
  email: Sequelize.TEXT,
  role: { type: Sequelize.ENUM, values: ["Provider", "Consumer"] },
});

User.belongsToMany(Ticket, { through: "User_Tickets" });
Ticket.belongsToMany(User, { through: "User_Tickets" });
