import winston from 'winston'

const { combine, timestamp, errors, json, splat, label } = winston.format

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    label({ label: 'prieelo' }),
    timestamp(),
    errors({ stack: true }),
    splat(),
    json()
  ),
  defaultMeta: { service: 'prieelo-app' },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
})

export default logger
