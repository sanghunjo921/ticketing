import { Sequelize } from "sequelize";
import { sequelize } from "../db/postgres";
import { User } from "./Ticket";

const discountRatios = {
  Platinum: 0.1, // 10%
  Gold: 0.08, // 8%
  Silver: 0.05, // 5%
  Bronze: 0.03, // 3%
};

export const DiscountRate = sequelize.define("DiscountRate", {
  membershipLevel: {
    type: Sequelize.ENUM,
    values: Object.keys(discountRatios),
    unique: true,
  },
  discountRatio: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
});

const discountRateInstances = Object.keys(discountRatios).map(
  (membershipLevel) => ({
    membershipLevel,
    discountRatio: discountRatios[membershipLevel],
  })
);

export const insertDiscountData = () => {
  DiscountRate.bulkCreate(discountRateInstances);
};

DiscountRate.associate = (models) => {
  DiscountRate.hasMany(models.User, { foreignKey: "discountRateId" });
};
