import { Sequelize } from "sequelize";
import { sequelize } from "..";

const Discount = sequelize.define("Discount", {
  // Model attributes are defined here
  id: {
    type: Sequelize.UUID,
    autoIncrement: true,
    primaryKey: true,
  },
  percentage: Sequelize.INTEGER,
  expiry_date: Sequelize.DATEONLY,
});
