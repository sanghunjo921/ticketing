import { kafka } from "./client";

export const initKafkaProducer = async () => {
  const producer = kafka.producer();

  try {
    await producer.connect();
    console.log("Kafka producer connected");
  } catch (error) {
    console.error("Failed to connect Kafka producer:", error);
    throw error;
  }

  return producer;
};

export const sendTransactionData = async (producer, data) => {
  try {
    await producer.send({
      topic: "transaction-topic",
      messages: [
        {
          value: JSON.stringify(data),
        },
      ],
    });
    console.log("transaction data sent to Kafka");
  } catch (error) {
    console.log("failed to send transaction data", error);
    throw error;
  }
};

// export const initKafkaProducer = async () => {
//   await producer.connect();
// };
// // 트랜잭션 생성 함수
// export const sendTransactionToKafka = async (
//   userId,
//   ticketId,
//   couponId,
//   appliedPrice
// ) => {
//   try {
//     const transactionData = {
//       userId,
//       ticketId,
//       couponId,
//       appliedPrice,
//     };

//     // Kafka 토픽에 메시지 전송
//     await producer.send({
//       topic: "transaction-topic",
//       messages: [{ value: JSON.stringify(transactionData) }],
//     });

//     console.log("Transaction data sent to Kafka successfully");
//   } catch (error) {
//     console.error("Error sending transaction data to Kafka:", error);
//   }
// };
