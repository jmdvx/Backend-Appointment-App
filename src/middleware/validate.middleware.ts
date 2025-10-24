import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const validate = (schema: z.ZodObject<any>) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  console.log('=== VALIDATION MIDDLEWARE DEBUG ===');
  console.log('Original req.body:', req.body);
  console.log('Phone number in req.body:', req.body.phonenumber);

  const validation = schema.safeParse(req.body);

  if (!validation.success) {
    console.log('Validation failed:', validation.error.issues);
    return res.status(400).json({
      message: 'Validation failed',
      errors: validation.error.issues
    });
  }

  console.log('Validation successful, validated data:', validation.data);
  req.body = validation.data

  next();
};
