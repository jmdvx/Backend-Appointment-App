
import { z } from "zod";
import { ObjectId } from "mongodb";



export const ObjectIdSchema = z
  .string()
  .refine((val) => ObjectId.isValid(val), {
    message: "Invalid ObjectId"
  });
