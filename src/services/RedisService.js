import { createClient } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

class RedisService {
  constructor() {
    try {
      this.client = createClient({
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST || "redis",
      });
      this.client.on("error", (err) => console.log("redis error:", err));
    } catch (e) {
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

  async decreBy(key, amount = 1) {
    return this.client.decrby(key, amount);
  }

  async removeKey(key) {
    return this.client.del(key);
  }

  async mgetValue(...keys) {
    // const values = await Promise.all(keys.map((key) => this.client.get(key)));
    // return values.map((value) => (value ? JSON.parse(value) : null));
    return this.client.mget(...keys);
  }

  async msetValue(keyValuePairs) {
    const flattenedPairs = [];

    for (const [key, value] of Object.entries(keyValuePairs)) {
      flattenedPairs.push(key, JSON.stringify(value));
    }

    return this.client.mset(flattenedPairs);
  }

  async connect() {
    await this.client.connect();
  }
}

export const redisService = new RedisService();
