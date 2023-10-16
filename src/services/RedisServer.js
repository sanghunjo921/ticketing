import { createClient } from "redis";

class RedisServer {
  constructor() {
    try {
      this.client = createClient();
    } catch (e) {
      console.log(e.message);
      if (!this.client) {
        this.client = new Map();
      }
    }
  }

  setValue(key, value) {
    this.client.set(key, value);
  }

  getValue(key) {
    this.client.get(key);
  }

  async connect() {
    await this.client.connect();
  }
}

export const redisServer = new RedisServer();
