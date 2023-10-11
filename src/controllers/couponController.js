import { Coupon } from "../models/Ticket";

export const couponController = {
  getAllCoupons: async (req, res) => {
    const coupons = await Coupon.findAll();
    res.json({
      messge: "showing all coupons",
      data: {
        coupons,
      },
    });
  },

  createCoupon: async (req, res) => {
    const { code, amount, isPercentage, expiryDate } = req.body;
    const coupon = await Coupon.create({
      code,
      amount,
      isPercentage,
      expiryDate,
    });
    console.log(coupon);
    res.json({
      message: "new coupon is created",
      data: {
        coupon,
      },
    });
  },
};
