import { Sequelize } from "sequelize";
import { sequelize } from "../db.js";

import { Coupon, Ticket, User } from "./Ticket.js";

export const Transaction = sequelize.define("Transaction", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: Sequelize.INTEGER,
  ticketId: Sequelize.INTEGER,
  couponId: Sequelize.INTEGER,
  totalPrice: Sequelize.INTEGER,
});

Transaction.belongsTo(User);
Transaction.belongsTo(Ticket);
Transaction.belongsTo(Coupon);
