import winston, { createLogger, format, transports } from "winston";
import * as systeminformation from "systeminformation";
import { LogstashTransport } from "winston-logstash-transport";

const { combine, timestamp, prettyPrint, splat } = format;

// export const getSystemInfo = async () => {
//   try {
//     const cpuInfo = await systeminformation.cpu();
//     const memInfo = await systeminformation.mem();
//     const diskInfo = await systeminformation.fsSize();
//     return { cpu: cpuInfo, memory: memInfo, disk: diskInfo };
//   } catch (error) {
//     return { error: "Failed to retrieve system information" };
//   }
// };

export const logger = createLogger({
  format: combine(splat(), timestamp(), prettyPrint()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "log/combined.log" }),
    new LogstashTransport({
      host: "localhost", // or your Logstash server address
      port: 5044,
      ssl_enable: false,
      max_connect_retries: -1,
      timeout_connect_retries: 3000,
    }),
  ],
});

// setInterval(async () => {
//   const systemInfo = await getSystemInfo();
//   logger.info("System Information", systemInfo);
// }, 60000);
