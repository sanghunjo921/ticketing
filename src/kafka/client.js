const { Kafka } = require("kafkajs");

// Kafka 클라이언트 설정
export const kafka = new Kafka({
  clientId: "ticketing-app",
  brokers: ["localhost:9092"],
});
