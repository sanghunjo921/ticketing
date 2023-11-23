import express from "express";
import cookieParser from "cookie-parser";
import { initialize } from "./db/postgres";
import { errorHandler } from "./middlewares/error";
import { ticketRouter } from "./routes/ticketRouter";
import { userRouter } from "./routes/userRouter";
import { couponRouter } from "./routes/couponRouter";
import { discountRateRouter } from "./routes/discountRouter";
import { logger } from "./middlewares/logger";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5500;

app.use(cookieParser()); // 마지막에 next 호출되서 다음 미들웨어로 넘어감. 보통 request에 timeout 걸어둠 (스파게티 코드) 5초~10초안에 결과를 못돌려주면 무언가 문제
app.use(express.json());
// app.use(authenticated) global하게 authenticate 걸어줌
app.use("/tickets", ticketRouter);
app.use("/", userRouter);
app.use("/", couponRouter);
app.use("/", discountRateRouter);
app.use(errorHandler);

initialize()
  .then(async (message) => {
    console.log(message);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      logger.info(`server${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
