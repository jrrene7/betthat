import winston from "winston";

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const extras = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${ts} [${level}] ${message}${extras}${stack ? `\n${stack}` : ""}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  defaultMeta: { service: "betthat" },
  transports: [new winston.transports.Console()],
});

export default logger;
