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

const cryptr = new Cryptr(process.env.CRYTR_KEY || "crytr_key");

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
      const { ticketId } = req.body;

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const ticketKey = `user:${userId}:ticket:${ticketId}`;
      const ticketRemainingKey = `${ticketKey}:remaining`;
      const ticketQuantityKey = `${ticketKey}:quantity`;

      logger.info("started getting ticketData from redis");
      let ticketData = await redisService.getValue(ticketKey);
      logger.info("finished getting ticketData from redis");

      let ticketRemainingData = await redisService.getValue(ticketRemainingKey);
      let ticketQuantityData =
        (await redisService.getValue(ticketQuantityKey)) || 1;

      if (!ticketData) {
        logger.info("started finding a ticket by a key from a db");
        const ticket = await Ticket.findByPk(ticketId);
        logger.info("finished finding a ticket by a key from a db");

        if (!ticket) {
          return res.status(404).json({ error: "Ticket not found" });
        }

        ticketRemainingData = ticket.remaining_number;
        redisService.setValue(ticketRemainingKey, ticketRemainingData);

        ticketData = {
          status: ticket.status,
          price: ticket.price,
        };
        redisService.setValue(ticketQuantityKey, ticketQuantityData);
      } else {
        await redisService.increBy(ticketQuantityKey);
      }

      logger.info("started setting ticketData on redis");
      redisService.setValue(ticketKey, ticketData);
      logger.info("finished setting ticketData on redis");

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
        redisService.setValue(couponCountKey, couponCountData);
      } else {
        redisService.increBy(couponCountKey);
      }

      logger.info("setting a coupon on redis");
      redisService.setValue(couponKey, couponData);
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

      const ticketKey = `user:${userId}:ticket:${ticketId}`;
      const ticketRemainingKey = `${ticketKey}:remaining`;
      const ticketQuantityKey = `${ticketKey}:quantity`;

      logger.info("started getting ticketData from redis");
      const ticketData = await redisService.getValue(ticketKey);
      logger.info("finisehd getting ticketData from redis");

      let ticketRemainingData = await redisService.getValue(ticketRemainingKey);
      const ticketQuantityData =
        (await redisService.getValue(ticketQuantityKey)) || 0;

      if (ticketQuantityData < 1) {
        logger.info("started removing ticketData on redis");
        redisService.removeKey(ticketKey);
        redisService.removeKey(ticketRemainingKey);
        redisService.removeKey(ticketQuantityKey);
        logger.info("finished removing ticketData on redis");

        return res.status(400).json({ message: "invalid quantity" });
      }

      if (!ticketData) {
        console.log("User has no tickets");
        return res.status(400).json({ message: "User has no tickets" });
      }

      if (ticketRemainingData < ticketQuantityData) {
        return res.status(400).json({ message: "No available tickets" });
      }

      let appliedPrice = ticketData.price;

      const couponKey = `user:${userId}:coupon:${couponId}`;
      const couponCountKey = `${couponKey}:count`;

      logger.info("started getting couponData from redis");
      const couponData = await redisService.getValue(couponKey);
      logger.info("finished getting couponDat from redis");

      let couponCountData = await redisService.getValue(couponCountKey);

      if (couponCountData < 1) {
        logger.info("removing a couponKey from redis");
        await redisService.removeKey(couponKey);
        await redisService.removeKey(couponCountKey);
        logger.info("finished removing a couponkey from redis");
        couponCountData = 0;
      }

      console.log({ couponData });

      if (couponData && couponCountData) {
        const couponAmount = parseInt(couponData.amount, 10);

        if (couponData.isPercentage) {
          appliedPrice = Math.ceil(
            appliedPrice - (appliedPrice * couponAmount) / 100
          );
        } else {
          appliedPrice = Math.max(appliedPrice - couponAmount, 0);
        }
        console.log({ couponCountKey, couponCountData, t: "ttt" });
        await redisService.increBy(couponCountKey, -1);
        // console.log(await redisService.getValue(couponCountKey));
      }

      // if (user.discountRateId) {
      //   let discountRate = JSON.parse(
      //     await redisService.getValue(`${user.discountRateId}-discountRate`)
      //   );
      //   if (!discountRate) {
      //     discountRate = await DiscountRate.findByPk(user.discountRateId);
      //     redisService.setValue(
      //       `${user.discountRateId}-discountRate`,
      //       JSON.stringify(discountRate)
      //     );
      //   }

      //   console.log(discountRate.dataValues.discountRatio, "rate");
      //   appliedPrice -= appliedPrice * discountRate.dataValues.discountRatio;
      //   appliedPrice = Math.ceil(appliedPrice);
      // }

      logger.info("started creating a transaction");
      const transaction = await Transaction.create({
        userId: user.id,
        ticketId: parseInt(ticketId, 10),
        couponId: couponData ? couponId : null,
        totalPrice: appliedPrice,
      });
      logger.info("finished creating a transaction");

      ticketRemainingData = await redisService.increBy(ticketRemainingKey, -1);

      logger.info("started updating a ticket info");
      await Ticket.update(
        { remaining_number: ticketRemainingData },
        { where: { id: parseInt(ticketId, 10) } }
      );
      logger.info("finished updating a ticket info");
      console.log(await redisService.getValue(couponCountKey));

      await redisService.increBy(ticketQuantityKey, -1);

      logger.info("started updating ticketData on redis");
      redisService.setValue(ticketKey, ticketData);
      logger.info("finished updating ticketData on redis");

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

      return res.status(200).json(purchaseHistory);
    } catch (error) {
      next(error);
    }
  },
};
