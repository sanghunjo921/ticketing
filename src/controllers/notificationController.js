import { startNotification } from "../rabbitMq.js/rabbitMqService";

export const notificationController = {
  createNotification: async (req, res) => {
    try {
      await startNotification();
      return res
        .status(200)
        .json({ message: "Notification sent to a user successfully" });
    } catch (error) {
      throw error;
    }
  },
};
