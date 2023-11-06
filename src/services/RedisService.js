import { createClient } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

class RedisService {
  constructor() {
    try {
      this.client = createClient(process.env.REDIS_PORT, "redis");
      client.on("error", (err) => console.log("redis error:", err));
    } catch (e) {
      console.log(e.message);
      if (!this.client) {
        this.client = new Map();
      }
    }
  }

  async setValue(key, value) {
    this.client.set(key, value);
  }

  async getValue(key) {
    return this.client.get(key);
  }

  async connect() {
    await this.client.connect();
  }
}

export const redisService = new RedisService();
