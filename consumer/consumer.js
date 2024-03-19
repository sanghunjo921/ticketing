import amqp from "amqplib/callback_api.js";

// const RABBITMQ_URL = "amqp://sanghun:sanghun@ticketing-rabbitmq-1";

amqp.connect(
  {
    hostname: "ticketing-rabbitmq-1",
    username: "sanghun",
    password: "sanghun",
    port: "5672",
  },
  async (err, conn) => {
    if (err) {
      console.log("Connection Err: ", err);
      return false;
    }

    conn.createChannel(async (err, ch) => {
      if (err) {
        console.log("Channel Err: ", err);
        return false;
      }

      const requestQueue = "payment_request_queue";
      const responseQueue = "payment_response_queue";

      await ch.assertQueue(responseQueue, { durable: true });

      ch.consume(requestQueue, async (message) => {
        if (message !== null) {
          const requestData = JSON.parse(message.content.toString());
          console.log("Received payment request", requestData);
          const responseMessage = "Payment completed";
          ch.sendToQueue(responseQueue, Buffer.from(responseMessage), {
            persistent: true,
          });
          ch.ack(message);
        }
      });
    });
    conn.createChannel(async (err, ch) => {
      if (err) {
        console.log("Channel Err: ", err);
        return false;
      }
      const responseQueue = "payment_response_queue";

      ch.consume(responseQueue, async (message) => {
        if (message !== null) {
          console.log(
            "Received message before notification: ",
            message.content.toString()
          );
          ch.ack(message);
        }
      });
    });
  }
);

// const startPaymentProcessing = async () => {
//   let channel;
//   try {
//     const connection = await amqp.connect(RABBITMQ_URL);
//     channel = await connection.createChannel();

//     const requestQueue = "payment_request_queue";
//     const responseQueue = "payment_response_queue";

//     await channel.assertQueue(requestQueue, { durable: true });
//     await channel.assertQueue(responseQueue, { durable: true });

//     channel.consume(requestQueue, async (message) => {
//       if (message !== null) {
//         const requestData = JSON.parse(message.content.toString());
//         console.log("Received payment request", requestData);

//         const responseMessage = "Payment completed";
//         channel.sendToQueue(responseQueue, Buffer.from(responseMessage), {
//           persistent: true,
//         });
//         console.log("Payment completed message published");
//         channel.ack(message);
//       }
//     });
//   } catch (error) {
//     console.error("Error in startPaymentProcessing:", error);
//   } finally {
//     try {
//       if (channel) {
//         await channel.close();
//       }
//     } catch (error) {
//       console.error("Error closing channel:", error);
//     }
//   }
// };

// const startNotification = async () => {
//   let channel;
//   try {
//     const connection = await amqp.connect(RABBITMQ_URL);
//     channel = await connection.createChannel();

//     const responseQueue = "payment_response_queue";

//     await channel.assertQueue(responseQueue, { durable: true });

//     channel.consume(responseQueue, async (message) => {
//       if (message !== null) {
//         console.log(
//           "Received payment completed message:",
//           message.content.toString()
//         );

//         channel.ack(message);
//       }
//     });
//   } catch (error) {
//     console.error("Error in startNotification:", error);
//   } finally {
//     try {
//       if (channel) {
//         await channel.close();
//       }
//     } catch (error) {
//       console.error("Error closing channel:", error);
//     }
//   }
// };

// const executeProcesses = async () => {
//   try {
//     await startPaymentProcessing();
//     await startNotification();
//   } catch (error) {
//     console.error("Error:", error);
//   }
// };

// // executeProcesses();
