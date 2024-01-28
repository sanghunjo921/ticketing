import { createClient } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

class RedisService {
  constructor() {
    try {
      console.log("REDIS_PORT:", process.env.REDIS_PORT);
      console.log("REDIS_HOST:", process.env.REDIS_HOST);
      this.client = createClient({
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST || "redis",
      });
      this.client.on("error", (err) => console.log("redis error:", err));
    } catch (e) {
      console.log(e.message);
      if (!this.client) {
        this.client = new Map();
      }
    }
  }

  async setValue(key, value) {
    await this.client.set(key, JSON.stringify(value));
  }

  async getValue(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async increBy(key, amount = 1) {
    return this.client.incrby(key, amount);
  }

  async removeKey(key) {
    return this.client.del(key);
  }

  async connect() {
    await this.client.connect();
  }
}

export const redisService = new RedisService();
