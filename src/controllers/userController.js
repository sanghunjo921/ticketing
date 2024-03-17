import { Ticket, User, Coupon } from "../models/Ticket";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Cryptr from "cryptr";
import { jwtSecretKey } from "../utils";
import { Transaction } from "../models/Transaction";
import { DiscountRate } from "../models/DiscountRate";
import { AuthError } from "../errors/AuthError";
import { userService } from "../services/userService";
import { redisService } from "../services/RedisService";
import { logger } from "../middlewares/logger";
import { sequelize } from "../db/postgres";
import { processBatchedRequests } from "../services/cronService";
import {
  publishPaymentRequestMessage,
  setupRabbitMQ,
} from "../rabbitMq.js/rabbitMqService";

const cryptr = new Cryptr(process.env.CRYTR_KEY || "crytr_key");
const transactionsBuffer = [];

export const userController = {
  signUp: async (req, res, next) => {
    try {
      const { username, password, rePassword, email, role } = req.body;
      if (password !== rePassword) {
        throw new AuthError("Password not matched", 400);
      }

      const salt = await bcrypt.genSalt(10); //sync: 수백만 유저가 한번에 register하면 부하?
      const hash = await bcrypt.hash(password, salt);
      const user = await User.create({
        username,
        password: hash,
        email,
        role,
      });

      const discountRate = await DiscountRate.findOne({
        where: { membershipLevel: "Bronze" },
      });
      console.log({ discountRate });

      user.discountRateId = discountRate.dataValues.id;
      console.log({ user });
      await user.save();

      const secretKey = process.env.SECRET_KEY || "secret";
      const token = jwt.sign({ username, role }, secretKey, {
        expiresIn: "1m",
      });

      res.cookie("token", token, { httpOnly: true, maxAge: 1000 * 120 });
      res.json({
        message: "User is created",
        data: {
          token, //signup 순간에 로그인도 됨
        },
      });
    } catch (error) {
      next(error);
    }
  },

  updateMembershipLevel: async (req, res, next) => {
    try {
      const user = await userService.updateUserDiscount(
        req.params.id,
        req.body.membershipLevel
      );

      return res.status(200).json({
        message:
          "User's membership level and discount rate updated successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  signIn: async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username: username } });

    if (!user) {
      return res.status(400).json({
        message: "User is not found",
      });
    }

    if (!bcrypt.compare(password, user.password)) {
      return res.status(400).json({
        message: "Password is incorrect",
      });
    }

    const token = jwt.sign({ username, role: user.role }, jwtSecretKey, {
      expiresIn: "1m",
    });

    //refreshtoken이 만료되면 sign in이 다시 이루어져야함
    const refreshToken = jwt.sign({ username, role: user.role }, jwtSecretKey, {
      expiresIn: "1w",
    });

    redisServer.setValue(username, refreshToken);

    res.cookie("r", cryptr.encrypt(refreshToken), {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    res.json({
      message: "User is signed in successfully",
      data: {
        token,
      },
    });
  },

  refreshToken: async (req, res, next) => {
    try {
      const refreshToken = cryptr.decrypt(req.cookies.r);
      if (!refreshToken) {
        res.status(401);
        throw new Error("Authentication is failed");
      }

      const { username, role } = jwt.verify(refreshToken, jwtSecretKey);

      const cachedToken = redisServer.getValue(username);
      if (cachedToken !== refreshToken) {
        res.status(403);
        throw new Error("Refresh toekn is not valid");
      }

      //새로운 access toekn 생성
      const newToken = jwt.sign({ username, role }, jwtSecretKey, {
        expiresIn: "1m",
      });
      res.json({
        message: "token is refreshed",
        data: {
          newToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  getProfile: async (req, res) => {
    res.json({
      message: "Get My Profile",
      data: {
        me: req.user,
      },
    });
  },

  // getAllUsers: async (req, res) => {
  //   const users = await User.findAll();
  //   console.log(users);
  //   res.json({
  //     message: "Get all users",
  //     data: {
  //       users,
  //     },
  //   });
  // },

  getAllUsersWithCoupons: async (req, res, next) => {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Coupon,
            through: "User_Coupons",
          },
        ],
      });

      res.json({
        message: "Get all users",
        data: {
          users,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res) => {
    const targetUser = await User.findByPk(req.params.id);
    res.json({
      message: "Get one user info",
      data: {
        targetUser,
      },
    });
  },

  reserveTicket: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { ticketId, amount = 1 } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const ticketKey = `user:${userId}:ticket:${ticketId}`;
      const ticketRemainingKey = `ticket:${ticketId}:remaining`;
      const ticketQuantityKey = `${ticketKey}:quantity`;

      logger.info("started getting ticketData from redis");
      let [ticketData, ticketRemainingData] = await redisService.mgetValue(
        ticketKey,
        ticketRemainingKey
      );
      logger.info("finished getting ticketData from redis");

      if (ticketRemainingData && ticketRemainingData < amount) {
        return res.status(400).json({
          error: "Insufficient remaining quantity available for reservation",
        });
      }

      if (!ticketData) {
        logger.info("started finding a ticket by a key from a db");
        const ticket = await Ticket.findByPk(ticketId);
        logger.info("finished finding a ticket by a key from a db");

        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }

        if (!ticketRemainingData) {
          ticketRemainingData = ticket.remaining_number;
        }
        if (ticketRemainingData > amount) {
          ticketRemainingData -= amount;
        } else {
          return res.status(400).json({
            error: "Insufficient remaining quantity available for reservation",
          });
        }

        ticketData = {
          status: ticket.status,
          price: ticket.price,
        };
        await redisService.msetValue({
          [ticketKey]: ticketData,
          [ticketRemainingKey]: ticketRemainingData,
          [ticketQuantityKey]: amount,
        });
      } else {
        await Promise.all([
          await redisService.increBy(ticketQuantityKey, amount),
          await redisService.decreBy(ticketRemainingKey, amount),
        ]);
      }
      return res
        .status(200)
        .json({ message: "Ticket was reserved user successfully" });
    } catch (error) {
      next(error);
    }
  },

  giveCouponToUser: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { couponId } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const couponKey = `user:${userId}:coupon:${couponId}`;
      const couponCountKey = `${couponKey}:count`;

      logger.info("getting a coupon from redis");
      let couponData = await redisService.getValue(couponKey);
      logger.info("finisehd getting a coupon from redis");

      let couponCountData = (await redisService.getValue(couponCountKey)) || 1;

      if (!couponData) {
        logger.info("getting a coupon by a key from a db");
        const coupon = await Coupon.findByPk(couponId);
        logger.info("finisehd getting a coupon by a key from a db");

        if (!coupon) {
          return res.status(404).json({ error: "Coupon not found" });
        }

        couponData = {
          amount: coupon.amount,
          isPercentage: coupon.isPercentage,
        };
        await redisService.setValue(couponCountKey, couponCountData);
      } else {
        await redisService.increBy(couponCountKey);
      }

      logger.info("setting a coupon on redis");
      await redisService.setValue(couponKey, couponData);
      logger.info("finished setting a coupon");

      console.log(`coupon : ${await redisService.getValue(couponKey)}`);

      return res
        .status(200)
        .json({ message: "Coupon added to user successfully" });
    } catch (error) {
      next(error);
    }
  },

  buyTicketById: async (req, res, next) => {
    const userId = req.params.id;
    const ticketId = req.params.ticketId;
    const couponId = req.body.couponId;

    try {
      const user = await User.findByPk(userId, {
        include: [],
      });

      if (!user) {
        throw new AuthError("user not found", 404);
      }

      const batchSize = 5000;
      const ticketKey = `user:${userId}:ticket:${ticketId}`;
      const ticketRemainingKey = `ticket:${ticketId}:remaining`;
      const ticketQuantityKey = `${ticketKey}:quantity`;
      const couponKey = `user:${userId}:coupon:${couponId}`;
      const couponCountKey = `${couponKey}:count`;
      const discountKey = `${user.dataValues.discountRateId}:discountRate`;
      const transactionDataKey = "transaction";

      logger.info("started getting ticketData from redis");
      let [
        ticketData,
        ticketRemainingData,
        ticketQuantityData,
        couponData,
        couponCountData,
        discountData,
        cachedTransactionData,
      ] = await redisService.mgetValue(
        ticketKey,
        ticketRemainingKey,
        ticketQuantityKey,
        couponKey,
        couponCountKey,
        discountKey,
        transactionDataKey
      );
      logger.info("finisehd getting ticketData from redis");

      if (!ticketData) {
        return res.status(400).json({ message: "User has no tickets" });
      }
      couponData = JSON.parse(couponData);
      ticketData = JSON.parse(ticketData);
      discountData = JSON.parse(discountData);
      let appliedPrice = ticketData.price;

      if (couponData && couponCountData) {
        const couponAmount = parseInt(couponData.amount, 10);

        if (couponData.isPercentage) {
          appliedPrice = Math.ceil(
            appliedPrice - (appliedPrice * couponAmount) / 100
          );
        } else {
          appliedPrice = Math.max(appliedPrice - couponAmount, 0);
        }
        await redisService.increBy(couponCountKey, -1);
      }

      if (couponData && couponCountData === 1) {
        logger.info("removing a couponKey from redis");
        await Promise.all([
          redisService.removeKey(couponKey),
          redisService.removeKey(couponCountKey),
        ]);
        logger.info("finished removing a couponkey from redis");
      }

      if (!discountData) {
        discountData = await DiscountRate.findByPk(
          user.dataValues.discountRateId
        );
        console.log("here");
        discountData = discountData.dataValues.discountRatio;
        await redisService.setValue(discountKey, discountData);
      }

      appliedPrice -= appliedPrice * discountData;
      appliedPrice = Math.ceil(appliedPrice);

      logger.info("started creating a transaction");

      if (!cachedTransactionData) {
        cachedTransactionData = [];
      } else {
        cachedTransactionData = JSON.parse(cachedTransactionData);
      }

      const transactionData = {
        userId: user.id,
        ticketId: parseInt(ticketId, 10),
        couponId: couponData ? couponId : null,
        totalPrice: appliedPrice,
      };

      cachedTransactionData.push(transactionData);

      await redisService.setValue(transactionDataKey, cachedTransactionData);

      // if (cachedTransactionData.length === batchSize) {
      //   // await processBatchedRequests(cachedTransactionData, batchSize);
      // }

      logger.info("finished creating a transaction");

      logger.info("started updating a ticket info");
      await Ticket.update(
        {
          remaining_number: sequelize.literal(
            `remaining_number - ${ticketQuantityData}`
          ),
        },
        { where: { id: parseInt(ticketId, 10) } }
      );
      logger.info("finished updating a ticket info");

      // await publishPaymentRequestMessage(userId, ticketId);

      return res.status(200).json({ message: "Ticket purchased successfully" });
    } catch (error) {
      next(error);
    }
  },

  getPurchaseHistory: async (req, res) => {
    const userId = req.params.id;

    try {
      const purchaseHistory = await Transaction.findAll({
        where: { userId },
        include: [Ticket, Coupon],
        order: [["createdAt", "DESC"]],
      });

      return res.status(200).json({
        message: "Get all purchase history",
        data: {
          purchaseHistory,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
