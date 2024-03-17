import { startPaymentProcessing } from "../rabbitMq.js/rabbitMqService";

export const paymentController = {
  createPayment: async (req, res) => {
    try {
      await startPaymentProcessing();
      return res.status(200).json({ message: "Ticket paid successfully" });
    } catch (error) {
      throw error;
    }
  },
};
