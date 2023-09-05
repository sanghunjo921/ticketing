import { Sequelize } from "sequelize";
import { sequelize } from "..";

const Coupon = sequelize.define("Coupon", {
  // Model attributes are defined here
  id: {
    type: Sequelize.UUID,
    autoIncrement: true,
    primaryKey: true,
  },
  amount: Sequelize.INTEGER,
  expiry_date: Sequelize.DATEONLY,
});
