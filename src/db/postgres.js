import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();
const { DB_HOST, DB_NAME, DB_PASSWORD, DB_USER, DB_PORT, DB_DIALECT } =
  process.env;
export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST || "localhost",
  dialect: DB_DIALECT,
  port: DB_PORT,
  dialectOptions: {
    raw: true,
  },
  pool: {
    max: 1000,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve("Postgres DB is connected");
      })
      .catch((err) => {
        reject(err);
      });
  });
};
