import { Redis } from "ioredis";
import cron from "node-cron";
import dotenv from "dotenv";
import { initialize } from "./db.js";
import { Transaction } from "./models/Transaction.js";

dotenv.config();

const batchInterval = "* * * * *";
const redisService = new Redis({
  port: process.env.REDIS_PORT || "6379",
  host: process.env.REDIS_HOST || "redis",
});

// Purchase 요청 처리 함수
export const processBatchedRequests = async (batchedRequests, batchSize) => {
  //   if (batchedRequests.length === 0 || batchSize === 0) return;

  console.log({ batchedRequests });
  console.log(`Batched requests count: ${batchedRequests.length}`);

  try {
    const transactionsToCreate = batchedRequests.splice(0, batchSize);
    await Transaction.bulkCreate(transactionsToCreate);
    await redisService.set("transaction", JSON.stringify(batchedRequests));
    console.log("Batch processing completed.");
    console.log(`after Batched requests count: ${batchedRequests.length}`);
  } catch (error) {
    console.error("Error processing batched requests:", error);
  }
};

export const initiateCron = async () => {
  cron.schedule(batchInterval, async () => {
    try {
      console.log("started cron");
      const transactionDataKey = "transaction";
      let batchedRequests = await redisService.get(transactionDataKey);

      const currentTime = Date.now();
      const timeLimit = 10 * 60 * 1000;
      let batchSize = 0;
      batchedRequests = JSON.parse(batchedRequests);

      batchedRequests.forEach((item) => {
        if (currentTime - item.createdAt > timeLimit) {
          batchSize += 1;
        }
      });

      console.log(batchedRequests, batchSize);

      if (batchSize >= 1) {
        await processBatchedRequests(batchedRequests, batchSize);
      }
    } catch (error) {
      next(error);
    }
  });
};

initialize().then(async (message) => {
  console.log(message);
  initiateCron();
});
