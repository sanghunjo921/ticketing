import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  "ftyxmjbr",
  "ftyxmjbr",
  "4uQ5TCNwzOh90oTsIijmjNJF-8f0IjdK",
  {
    host: "floppy.db.elephantsql.com",
    dialect: "postgres",
    port: 5432,
    query: {
      raw: true,
    },
  }
);

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
