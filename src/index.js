import express from "express";
import { initialize } from "./db/postgres";
import { ticketRouter } from "./routes/ticketRouter";
import { userRouter } from "./routes/userRouter";

const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.json());
app.use("/tickets", ticketRouter);
app.use("/users", userRouter);

initialize()
  .then((message) => {
    console.log(message);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
