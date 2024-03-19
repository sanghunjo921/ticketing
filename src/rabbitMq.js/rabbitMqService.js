import amqp from "amqplib";

const RABBITMQ_URL = "amqp://sanghun:sanghun@ticketing-rabbitmq-1";

export const publishPaymentRequestMessage = async (userId, ticketId) => {
  let channel;
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    const queueName = "payment_request_queue";
    await channel.assertQueue(queueName, { durable: true });

    const message = JSON.stringify({ userId, ticketId });
    channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
    });

    console.log("Payment request message publisehd", message);
  } catch (error) {
    console.error("Error publishing payment request message:", error);
    throw error;
  }
};
