import express from "express";
import { Sequelize } from "sequelize";
import { ticketRouter } from "./routes/ticketRouter";
import { userRouter } from "./routes/userRouter";

const app = express();
const PORT = process.env.PORT || 5500;

export const sequelize = new Sequelize("database", "postgres", "postgres", {
  host: "db",
  dialect: "postgres",
});

app.use("/tickets", ticketRouter);
app.use("/users", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
