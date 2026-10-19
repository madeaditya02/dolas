// src/middlewares/validate.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { ZodAny, ZodError, ZodRecord, type ZodObject } from "zod";

export const validateBody = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // Menjalankan validasi pada req.body
      await schema.parseAsync(req.body);

      // Jika berhasil, lanjut ke controller
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Mengubah format bawaan Zod menjadi format kustom Anda
        const formattedErrors: Record<string, string[]> = {};

        error.issues.forEach((issue) => {
          // Zod menyimpan nama field di array 'path'
          const field = issue.path.join(".");

          if (!formattedErrors[field]) {
            formattedErrors[field] = [];
          }
          formattedErrors[field].push(issue.message);
        });

        // Mengembalikan response 400 Bad Request
        return res.status(400).json({
          error: "validation-error",
          message: "Terdapat kesalahan pada data yang diinputkan",
          errors: formattedErrors
        });
      }
      // Fallback jika terjadi error di luar validasi Zod
      return res.status(500).json({
        error: "server-error",
        message: "Terjadi kesalahan pada sistem validasi"
      });
    }
  };
};

export const validateQuery = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // Menimpa req.query dengan hasil parse agar transformasi Zod (coerce) diterapkan
      const parsedQuery = await schema.parseAsync(req.query) as any;
      Object.defineProperty(
        req,
        'query',
        {
          ...Object.getOwnPropertyDescriptor(req, 'query'),
          writable: false,
          value: parsedQuery,
        });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.issues.forEach((issue) => {
          const field = issue.path.join(".");
          if (!formattedErrors[field]) formattedErrors[field] = [];
          formattedErrors[field].push(issue.message);
        });
        return res.status(400).json({ errors: formattedErrors });
      }
      console.error(error)
      return res.status(500).json({ error: "validation-error", message: "Kesalahan validasi query" });
    }
  };
};

