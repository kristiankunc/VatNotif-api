import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

export const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp({
			format: "YYYY-MM-DD HH:mm:ss",
		}),
		winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
	),
	transports: [
		new DailyRotateFile({
			filename: "combined-%DATE%.log",
			datePattern: "YYYY-MM-DD",
			zippedArchive: true,
			maxSize: "5m",
			maxFiles: "5d",
		}),
	],
});

if (process.env.NODE_ENV !== "production") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp({
					format: "YYYY-MM-DD HH:mm:ss",
				}),
				winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
			),
		})
	);
}
