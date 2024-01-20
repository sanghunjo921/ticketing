import { DiscountRate, insertDiscountData } from "../models/DiscountRate";

export const discountController = {
  getAllDiscountRates: async (req, res) => {
    const discounts = await DiscountRate.findAll();
    res.json({
      messge: "showing all discount rates based on membership",
      data: {
        discounts,
      },
    });
  },

  insertDiscountData: async (req, res) => {
    await insertDiscountData();
    res.json({
      message: "created bulk discount rates",
    });
  },
};
