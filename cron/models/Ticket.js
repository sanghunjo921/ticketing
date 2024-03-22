import { Sequelize } from "sequelize";
import { sequelize } from "../db.js";
import { DiscountRate } from "./DiscountRate.js";

export const Ticket = sequelize.define("Ticket", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: Sequelize.STRING,
  description: Sequelize.TEXT,
  status: { type: Sequelize.ENUM, values: ["Available", "Sold Out"] },
  price: Sequelize.INTEGER,
  discountedPrice: Sequelize.INTEGER,
  remaining_number: Sequelize.INTEGER,
});

export const User = sequelize.define("User", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: Sequelize.STRING,
  password: Sequelize.TEXT,
  email: Sequelize.TEXT,
  role: { type: Sequelize.ENUM, values: ["Provider", "Consumer"] },
  membershipLevel: {
    type: Sequelize.ENUM,
    values: ["Platinum", "Gold", "Silver", "Bronze"],
    defaultValue: "Bronze",
  },
  discountRateId: {
    type: Sequelize.INTEGER,
    references: {
      model: DiscountRate,
      key: "id",
    },
  },
  // refreshToken: Sequelize.STRING,
});

export const Coupon = sequelize.define("Coupon", {
  code: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },

  amount: {
    type: Sequelize.DECIMAL(6, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0,
      max: function () {
        return this.isPercentage ? 100 : 100000;
      },
    },
  },

  isPercentage: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },

  expiryDate: {
    type: Sequelize.DATE,
    allowNull: false,
  },
});

User.belongsToMany(Ticket, { through: "User_Tickets" });
Ticket.belongsToMany(User, { through: "User_Tickets" });

User.belongsToMany(Coupon, { through: "User_Coupons" });
Coupon.belongsToMany(User, { through: "User_Coupons" });

User.associate = (models) => {
  User.belongsTo(models.DiscountRate, { foreignKey: "discountRateId" });
};
