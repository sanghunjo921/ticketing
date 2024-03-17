import amqp from "amqplib";

const RABBITMQ_URL = "amqp://sanghun:sanghun@ticketing-rabbitmq-1";

export const publishPaymentRequestMessage = async (userId, ticketId) => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    const queueName = "payment_request_queue";
    await channel.assertQueue(queueName, { durable: true });

    const message = JSON.stringify({ userId, ticketId });
    await channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
    });

    console.log("Payment request message publisehd", message);
  } catch (error) {
    console.error("Error publishing payment request message:", error);
    throw error;
  }
};

export const startPaymentProcessing = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    const requestQueue = "payment_request_queue";
    const responseQueue = "payment_response_queue";

    await channel.assertQueue(responseQueue, { durable: true });

    channel.consume(requestQueue, async (message) => {
      if (message !== null) {
        const requestData = JSON.parse(message.content.toString());
        console.log("Received payment request", requestData);

        const responseMessage = "Payment completed";
        channel.sendToQueue(responseQueue, Buffer.from(responseMessage), {
          persistent: true,
        });
        console.log("Payment completed message published");
        channel.ack(message);
      }
    });
  } catch (error) {
    throw error;
  }
};

export const startNotification = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    const responseQueue = "payment_response_queue";

    channel.consume(responseQueue, async (message) => {
      if (message !== null) {
        console.log(
          "Received payment completed message:",
          message.content.toString()
        );

        channel.ack(message);
      }
    });
  } catch (error) {
    throw error;
  }
};
