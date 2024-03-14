const { Transaction } = require("../models/Transaction");

const batchSize = 3;
const batchInterval = 5000;

// Purchase 요청 처리 함수
export const processBatchedRequests = async (batchedRequests) => {
  if (batchedRequests.length === 0) return;

  console.log({ batchedRequests });
  console.log(`Batched requests count: ${batchedRequests.length}`);

  try {
    if (batchedRequests.length > batchSize) {
      const transactionsToCreate = batchedRequests.slice(0, batchSize); // batchSize만큼의 요청만 처리
      await Transaction.bulkCreate(
        transactionsToCreate.map((request) => ({
          userId: request.userId,
          ticketId: request.ticketId,
          couponId: request.couponId,
          totalPrice: request.totalPrice,
        }))
      );
      batchedRequests.splice(0, batchSize + 1);
      console.log("Batch processing completed.");
    }
    console.log({ batchedRequests });
    console.log(`Batched requests count: ${batchedRequests.length}`);
  } catch (error) {
    console.error("Error processing batched requests:", error);
  }
};
