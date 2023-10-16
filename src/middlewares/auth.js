import jwt from "jsonwebtoken";
import { User } from "../models/Ticket";
import { jwtSecretKey } from "../utils";

export const authenticated = async (req, res, next) => {
  //   console.log("authenticated", {
  //     headers: req.headers,
  //     token: req.headers["x-auth-token"],
  //     token1: req.headers.authorization.split(" ")[1],
  //     toekn2: req.headers.cookie,
  //     token3: req.cookies,
  //   });

  // headers
  try {
    // const token = req.cookies.token;
    const token = req.headers["x-auth-token"];
    if (!token) {
      res.status(401);
      throw new Error("Authentication is failed");
    }

    const { username } = jwt.verify(token, jwtSecretKey); //payload

    const user = await User.findOne({ where: { username } });
    if (!user) {
      res.status(403);
      throw new Error("User does not exist");
    }
    req.user = user; //인증된 유저 req에 들어감

    next();
  } catch (e) {
    next(e);
  }
};

export const authorized = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401);
      throw new Error("Token is invalid");
    }
    const { role } = jwt.verify(token, jwtSecretKey);
    if (role !== "Provider") {
      res.status(403);
      throw new Error("No authorized user");
    }
    next();
  } catch (e) {
    next(e);
  }
};

// export const refreshAuth: async (req, res, next) => {
//     try {
//       const refreshToken = cryptr.decrypt(req.cookies.r);
//       if (!refreshToken) {
//         res.status(401);
//         throw new Error("Authentication is failed");
//       }

//       const { username, role } = jwt.verify(refreshToken, jwtSecretKey);

//       const cachedToken = redisServer.getValue(username);
//       if (cachedToken !== refreshToken) {
//         res.status(403);
//         throw new Error("Refresh toekn is not valid");
//       }

//       //새로운 access toekn 생성
//       const newToken = jwt.sign({ username, role }, jwtSecretKey, {
//         expiresIn: "1m",
//       });
//       res.json({
//         message: "token is refreshed",
//         data: {
//           newToken,
//         },
//       });
//     } catch (err) {
//       next(err);
//     }
//   };
