import { DiscountRate } from "../models/DiscountRate";
import { User } from "../models/Ticket";

class UserService {
  updateUserDiscount = async (id, newMembershipLevel) => {
    const user = await User.findByPk(id);

    if (!user) {
      throw new AuthError("User not found", 401);
    }

    if (newMembershipLevel) {
      user.membershipLevel = newMembershipLevel;
    }

    const discountRate = await DiscountRate.findOne({
      where: { membershipLevel: user.membershipLevel },
    });

    if (!discountRate) {
      throw new AuthError(
        "Discount rate not found for the specified membership level",
        400
      );
    }

    user.discountRateId = discountRate.id;
    return user.save();
  };
}

export const userService = new UserService();
