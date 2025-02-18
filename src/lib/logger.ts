import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const transports: winston.transport[] = [
	new winston.transports.Console({
		format: winston.format.combine(
			winston.format.timestamp({
				format: "DD-MM-YYYY HH:mm:ss",
			}),
			winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
		),
	}),
];

if (process.env.NODE_ENV === "production") {
	transports.push(
		new DailyRotateFile({
			filename: "combined-%DATE%.log",
			datePattern: "DD-MM-YYYY",
			zippedArchive: true,
			maxSize: "5m",
			maxFiles: "7d",
		})
	);
}

export const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp({
			format: "DD-MM-YYYY HH:mm:ss",
		}),
		winston.format.printf(({ level, message, timestamp }) => `${timestamp} ${level.toUpperCase()}: ${message}`)
	),
	transports: transports,
});
