export const jwtSecretKey = process.env.SECRET_KEY || "secret";

export const getTicketRandomPrice = 90 + Math.floor(Math.random() * 20);
