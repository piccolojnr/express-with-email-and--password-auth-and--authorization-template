import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/ApiErrors';

/**
 * Validation rule interface
 */
interface ValidationRule {
    field: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email' | 'url';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean | string;
}

/**
 * Validation result interface
 */
interface ValidationResult {
    isValid: boolean;
    errors: Array<{
        field: string;
        message: string;
    }>;
}

/**
 * Validate request body against rules
 */
export const validateBody = (rules: ValidationRule[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = validateData(req.body, rules);

        if (!result.isValid) {
            throw new ValidationError('Request validation failed', {
                errors: result.errors
            });
        }

        next();
    };
};

/**
 * Validate request query parameters
 */
export const validateQuery = (rules: ValidationRule[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = validateData(req.query, rules);

        if (!result.isValid) {
            throw new ValidationError('Query validation failed', {
                errors: result.errors
            });
        }

        next();
    };
};

/**
 * Core validation function
 */
export const validateData = (data: any, rules: ValidationRule[]): ValidationResult => {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
        const value = data[rule.field];
        const fieldErrors = validateField(value, rule);
        errors.push(...fieldErrors);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validate a single field
 */
const validateField = (value: any, rule: ValidationRule): Array<{ field: string; message: string }> => {
    const errors: Array<{ field: string; message: string }> = [];

    // Required validation
    if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
            field: rule.field,
            message: `${rule.field} is required`
        });
        return errors; // If required field is missing, skip other validations
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
        return errors;
    }

    // Type validation
    if (rule.type) {
        const typeError = validateType(value, rule.type, rule.field);
        if (typeError) {
            errors.push(typeError);
            return errors; // If type is wrong, skip other validations
        }
    }

    // Length validations for strings
    if (typeof value === 'string') {
        if (rule.minLength !== undefined && value.length < rule.minLength) {
            errors.push({
                field: rule.field,
                message: `${rule.field} must be at least ${rule.minLength} characters long`
            });
        }

        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            errors.push({
                field: rule.field,
                message: `${rule.field} must not exceed ${rule.maxLength} characters`
            });
        }
    }

    // Numeric range validations
    if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
            errors.push({
                field: rule.field,
                message: `${rule.field} must be at least ${rule.min}`
            });
        }

        if (rule.max !== undefined && value > rule.max) {
            errors.push({
                field: rule.field,
                message: `${rule.field} must not exceed ${rule.max}`
            });
        }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
            errors.push({
                field: rule.field,
                message: `${rule.field} format is invalid`
            });
        }
    }

    // Custom validation
    if (rule.custom) {
        const customResult = rule.custom(value);
        if (customResult !== true) {
            errors.push({
                field: rule.field,
                message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid`
            });
        }
    }

    return errors;
};

/**
 * Validate field type
 */
const validateType = (value: any, type: string, fieldName: string): { field: string; message: string } | null => {
    switch (type) {
        case 'string':
            if (typeof value !== 'string') {
                return { field: fieldName, message: `${fieldName} must be a string` };
            }
            break;

        case 'number':
            const num = Number(value);
            if (isNaN(num)) {
                return { field: fieldName, message: `${fieldName} must be a number` };
            }
            break;

        case 'boolean':
            if (typeof value !== 'boolean') {
                return { field: fieldName, message: `${fieldName} must be a boolean` };
            }
            break;

        case 'email':
            if (typeof value !== 'string' || !isValidEmail(value)) {
                return { field: fieldName, message: `${fieldName} must be a valid email address` };
            }
            break;

        case 'url':
            if (typeof value !== 'string' || !isValidUrl(value)) {
                return { field: fieldName, message: `${fieldName} must be a valid URL` };
            }
            break;
    }

    return null;
};

/**
 * Email validation helper
 */
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * URL validation helper
 */
const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Zod validation middleware
 */
export const validateRequestBody = (schema: any) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            schema.parse(req.body);
            next();
        } catch (error: any) {
            if (error.errors) {
                const validationErrors = error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));

                throw new ValidationError('Request validation failed', {
                    errors: validationErrors
                });
            }
            throw error;
        }
    };
};
