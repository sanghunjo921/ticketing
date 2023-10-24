import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("db", "root", "root", {
  host: "db",
  dialect: "postgres",
  port: 5432,
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
