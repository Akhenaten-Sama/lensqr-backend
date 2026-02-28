import Joi from 'joi';

export const fundWalletSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  reference: Joi.string().trim().max(100).required().messages({
    'any.required': 'Reference is required',
  }),
  description: Joi.string().trim().max(500).optional(),
});

export const transferSchema = Joi.object({
  recipient_email: Joi.string().email().lowercase().required().messages({
    'string.email': 'A valid recipient email is required',
    'any.required': 'Recipient email is required',
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  reference: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(500).optional(),
});

export const withdrawSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number',
    'any.required': 'Amount is required',
  }),
  reference: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(500).optional(),
});

export const transactionHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
