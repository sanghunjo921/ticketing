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
      const ticket = await Ticket.findByPk(ticketId);

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const ticketKey = `user:${userId}:ticket:${ticketId}`;

      let ticketData = await redisService.getValue(ticketKey);

      if (!ticketData) {
        ticketData = {
          status: ticket.status,
          price: ticket.price,
          remaining_number: ticket.remaining_number,
          quantity: 1,
        };
      } else {
        ticketData = JSON.parse(ticketData);
        ticketData.quantity += 1;
      }

      redisService.setValue(ticketKey, JSON.stringify(ticketData));

      await user.addTicket(ticket);

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
      const coupon = await Coupon.findByPk(couponId);

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      const couponKey = `user:${userId}:coupon:${couponId}`;

      let couponData = await redisService.getValue(couponKey);

      if (!couponData) {
        couponData = {
          count: 1,
          amount: coupon.amount,
        };
      } else {
        couponData = JSON.parse(couponData);
        couponData.count += 1;
        couponData.amount = coupon.amount;
      }

      redisService.setValue(couponKey, JSON.stringify(couponData));

      console.log(`coupon : ${await redisService.getValue(couponKey)}`);

      await user.addCoupon(coupon);

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
        include: [
          {
            model: Coupon,
            through: { attributes: [] },
          },
          // {
          //   model: Ticket,
          //   through: { attributes: [] },
          // },
        ],
      });

      if (!user) {
        throw new AuthError("user not found", 404);
      }

      const ticketIdNumber = parseInt(ticketId, 10);
      const ticketKey = `user:${userId}:ticket:${ticketId}`;
      const ticketData = JSON.parse(await redisService.getValue(ticketKey));

      let ticket;

      if (!ticketData) {
        console.log("User has no tickets");
        return res.status(400).json({ message: "User has no tickets" });
      } else {
        if (ticketData.remaining_number < ticketData.quantity) {
          return res.status(400).json({ message: "No available tickets" });
        }
      }

      // if (!user.Tickets || user.Tickets.length === 0) {
      //   console.log("User has no tickets");
      //   return res.status(400).json({ message: "User has no tickets" });
      // } else {
      //   ticket = user.Tickets.find(
      //     (ticket) => ticket.dataValues.id === ticketIdNumber
      //   );

      //   if (!ticket) {
      //     console.log("Ticket not found");
      //     return res.status(400).json({ message: "Ticket not found" });
      //   } else {
      //     if (ticket.dataValues.remaining_number <= 0) {
      //       return res.status(400).json({ message: "No available tickets" });
      //     }

      //     console.log("Found Ticket:", ticket.dataValues);
      //   }
      // }
      console.log(ticketData.price, typeof ticketData.price);
      // let appliedPrice = ticket.price;
      let appliedPrice = ticketData.price;

      let coupon;
      const redisKey = `user:${userId}:coupon:${couponId}`;
      const couponData = JSON.parse(await redisService.getValue(redisKey));

      if (user.Coupons && user.Coupons.length > 0 && couponData) {
        // couponKey = `coupon:${couponId}`;
        // const cachedCoupon = await redisService.getValue(couponKey);
        // console.log(cachedCoupon);

        coupon = user.Coupons.find(
          (coupon) => coupon.dataValues.id === couponId
        );

        const couponAmount = parseInt(couponData.amount, 10);

        // if (!cachedCoupon) {
        //   coupon = user.Coupons.find(
        //     (coupon) => coupon.dataValues.id === couponId
        //   );
        //   await redisService.setValue(couponKey, JSON.stringify(coupon));
        // } else {
        //   coupon = JSON.parse(cachedCoupon);
        // }

        // const couponAmount = parseInt(coupon.amount, 10);

        if (coupon) {
          if (coupon.isPercentage) {
            appliedPrice = Math.ceil(
              appliedPrice - (appliedPrice * couponAmount) / 100
            );
          } else {
            appliedPrice = Math.max(appliedPrice - couponAmount, 0);
          }
        }
        couponData.count = couponData.count - 1;
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

      const transaction = await Transaction.create({
        userId: user.id,
        ticketId: parseInt(ticketId, 10),
        couponId: coupon ? coupon.id : null,
        totalPrice: appliedPrice,
      });

      const updatedRemainingNumber =
        parseInt(ticketData.remaining_number, 10) - 1;

      await Ticket.update(
        { remaining_number: updatedRemainingNumber },
        { where: { id: parseInt(ticketId, 10) } }
      );
      console.log(coupon);
      if (coupon) {
        try {
          console.log("removing a coupon");
          console.log(couponData.count);
          if (couponData.count < 1) {
            await redisService.removeKey(redisKey);
            await user.removeCoupon(coupon.id);
          } else {
            redisService.setValue(redisKey, JSON.stringify(couponData));
          }
        } catch (err) {
          next(err);
        }
      }

      ticketData.remaining_number = updatedRemainingNumber;
      ticketData.quantity -= 1;

      redisService.setValue(ticketKey, JSON.stringify(ticketData));

      if (ticketData.quantity < 1) {
        redisService.removeKey(ticketKey);
      }

      return res
        .status(200)
        .json({ message: "Ticket purchased successfully", transaction });
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
