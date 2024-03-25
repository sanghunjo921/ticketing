import { Redis } from "ioredis";
import cron from "node-cron";
import dotenv from "dotenv";
import { initialize, sequelize } from "./db.js";
import { Transaction } from "./models/Transaction.js";
import { Ticket } from "./models/Ticket.js";

dotenv.config();

const batchInterval = "* * * * *";
const redisService = new Redis({
  port: process.env.REDIS_PORT || "6379",
  host: process.env.REDIS_HOST || "redis",
});

// Purchase 요청 처리 함수
export const processBatchedRequests = async (
  batchedRequests,
  batchSize,
  ticketMap
) => {
  //   if (batchedRequests.length === 0 || batchSize === 0) return;

  console.log({ batchedRequests });
  console.log(`Batched requests count: ${batchedRequests.length}`);

  try {
    const transactionsToCreate = batchedRequests.splice(0, batchSize);
    await Transaction.bulkCreate(transactionsToCreate);
    await redisService.set("transaction", JSON.stringify(batchedRequests));

    for (const [ticketId, value] of ticketMap.entries()) {
      await Ticket.update(
        {
          remaining_number: sequelize.literal(`remaining_number - ${value}`),
        },
        { where: { id: ticketId } }
      );
    }

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
      let ticketMap = new Map();
      batchedRequests = JSON.parse(batchedRequests);

      batchedRequests.forEach((item) => {
        console.log(typeof item.ticketId);
        if (currentTime - item.createdAt > timeLimit) {
          batchSize += 1;

          if (ticketMap.has(item.ticketId)) {
            ticketMap.set(item.ticketId, ticketMap.get(item.ticketId) + 1);
          } else {
            ticketMap.set(item.ticketId, 1);
          }
        }
      });

      console.log(batchedRequests, batchSize, ticketMap);

      if (batchSize >= 1) {
        await processBatchedRequests(batchedRequests, batchSize, ticketMap);
      }
    } catch (error) {
      console.error("Error during cron execution", error);
    }
  });
};

initialize().then(async (message) => {
  console.log(message);
  initiateCron();
});
