import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Runtime
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().when('NODE_ENV', {
    is: 'production', then: Joi.string().required(), otherwise: Joi.string().allow('').required(),
  }),
  DB_SSL: Joi.boolean().when('NODE_ENV', {
    is: 'production', then: Joi.boolean().default(true), otherwise: Joi.boolean().default(false),
  }),
  DB_SSL_CA_FILE: Joi.string().allow('').optional(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().pattern(/^[1-9]\d*(s|m|h|d)$/).default('15m'),
  JWT_REFRESH_EXPIRES: Joi.string().pattern(/^[1-9]\d*d$/).default('7d'),
  AUTH_COOKIE_DOMAIN: Joi.string().hostname().allow('').when('NODE_ENV', {
    is: 'production', then: Joi.string().default('finanscozum.net'), otherwise: Joi.string().default(''),
  }),

  // External API
  EXTERNAL_API_BASE_URL: Joi.string().uri().required(),
  EXTERNAL_API_KEY: Joi.string().allow('').default(''),

  // CORS
  CORS_ORIGIN: Joi.string().required(),

  // Throttle
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),

  // SMTP (optional)
  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),
  SMTP_FROM: Joi.string().allow('').optional(),
  SMTP_SSL_CA_FILE: Joi.string().allow('').optional(),
  SMTP_TLS_SERVERNAME: Joi.string().hostname().allow('').optional(),
});
