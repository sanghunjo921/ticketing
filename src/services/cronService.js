import { redisService } from "./RedisService";
import cron from "node-cron";

const { Transaction } = require("../models/Transaction");

const batchInterval = "0 15 * * *";

// Purchase 요청 처리 함수
export const processBatchedRequests = async (batchedRequests, batchSize) => {
  if (batchedRequests.length === 0) return;

  console.log({ batchedRequests });
  console.log(`Batched requests count: ${batchedRequests.length}`);

  try {
    const transactionsToCreate = batchedRequests.splice(0, batchSize);
    await Transaction.bulkCreate(transactionsToCreate);
    await redisService.setValue("transaction", batchedRequests);
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
      const batchedRequests = await redisService.getValue(transactionDataKey);
      await processBatchedRequests(batchedRequests, batchedRequests.length);
    } catch (error) {
      next(error);
    }
  });
};
