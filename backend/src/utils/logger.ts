// Logger - TypeScript Version
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    if (info instanceof Error) {
      return `${info.timestamp} [${info.level}]: ${info.message}\n${info.stack}`;
    }
    return `${info.timestamp} [${info.level}]: ${info.message} ${
      info.metadata ? JSON.stringify(info.metadata) : ''
    }`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info'],
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: 'info',
    }),
  ],
});

export default logger;
