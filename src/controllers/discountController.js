import { DiscountRate } from "../models/DiscountRate";

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
};
