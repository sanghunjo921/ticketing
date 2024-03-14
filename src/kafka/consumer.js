import { kafka } from "./client";

export const initKafkaConsumer = async () => {
  const consumer = kafka.consumer({ groupId: "ticketing-group" });

  try {
    await consumer.connect();
    console.log("Kafka consumer connected");
  } catch (error) {
    console.error("Failed to connect Kafka consumer:", error);
    throw error;
  }

  return consumer;
};

export const createTransaction = async (consumer) => {
  await consumer.subscribe({ topic: "transaction-topic" });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const transactionData = JSON.parse(message.value.toString());

      await Transaction.create({
        userId: transactionData.userId,
        ticketId: transactionData.ticketId,
        couponId: transactionData.couponId,
        totalPrice: transactionData.appliedPrice,
      });
    },
  });
};

// export async function runConsumer() {
//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       try {
//         // Kafka에서 메시지를 가져와서 데이터 추출
//         const transactionData = JSON.parse(message.value.toString());

//         // 트랜잭션 생성 코드
//         await Transaction.create({
//           userId: transactionData.userId,
//           ticketId: transactionData.ticketId,
//           couponId: transactionData.couponId,
//           totalPrice: transactionData.appliedPrice,
//         });

//         console.log("Transaction processed successfully");
//       } catch (error) {
//         console.error("Error processing transaction:", error);
//       }
//     },
//   });
// }
