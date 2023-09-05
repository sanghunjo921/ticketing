import { Sequelize } from "sequelize";
import { sequelize } from "..";

const User = sequelize.define("User", {
  // Model attributes are defined here
  id: {
    type: Sequelize.UUID,
    autoIncrement: true,
    primaryKey: true,
  },
  username: Sequelize.STRING,
  password: Sequelize.TEXT,
  email: Sequelize.TEXT,
  role: { type: Sequelize.ENUM, values: ["Provider", "Consumer"] },
});
