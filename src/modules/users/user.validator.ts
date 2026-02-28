import Joi from 'joi';

export const createUserSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'First name is required',
    'any.required': 'First name is required',
  }),
  last_name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Last name is required',
    'any.required': 'Last name is required',
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'A valid email address is required',
    'any.required': 'Email is required',
  }),
  phone_number: Joi.string()
    .pattern(/^\+?[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid international format e.g. +2348012345678',
      'any.required': 'Phone number is required',
    }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});
