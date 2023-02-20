// https://www.section.io/engineering-education/logging-with-winston/

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
  format: format.combine(
    format.timestamp(),
    // format.splat(),
    format.simple(),
    format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: `logs/${new Date().toISOString()}.log` }),
  ]
})


module.exports = logger
