import { BaseError } from "../errors/BaseError";

export const errorHandler = (err, req, res, next) => {
  if (err instanceof BaseError) {
    res.status(err.status);
  } else {
    res.status(400);
  }
  res.json({
    ok: false,
    message: err.message,
  });

  next();
};
