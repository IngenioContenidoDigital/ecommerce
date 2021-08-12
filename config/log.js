/**
 * Built-in Log Configuration
 * (sails.config.log)
 *
 * Configure the log level for your app, as well as the transport
 * (Underneath the covers, Sails uses Winston for logging, which
 * allows for some pretty neat custom transports/adapters for log messages)
 *
 * For more information on the Sails logger, check out:
 * https://sailsjs.com/docs/concepts/logging
 */
const winston = require('winston');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

 const logger = winston.createLogger({
   level: 'error',
   format: combine(
    label({ label: '1ECOMMERCE' }),
    timestamp(),
    myFormat
    ),
   transports: [
     new winston.transports.File({ filename: 'error.log', level: 'error'})
   ],
 });
 
 //
 // If we're not in production then log to the `console` with the format:
 // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
 //
 if (process.env.NODE_ENV !== 'production') {
   logger.add(new winston.transports.Console({
     format: winston.format.simple(),
   }));
 }

 module.exports.log = {
  level: 'error',
  custom: logger,
  inspect: false 
};
