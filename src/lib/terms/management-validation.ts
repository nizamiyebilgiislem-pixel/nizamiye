import { z } from "zod";

const emptyDateToNull = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  return value.trim() === "" ? null : value;
}, z.string().nullable());

export const createAcademicTermSchema = z
  .object({
    name: z.string().trim().min(1, "Dönem adı zorunludur."),
    start_date: emptyDateToNull,
    end_date: emptyDateToNull,
  })
  .superRefine((value, ctx) => {
    if (!value.start_date || !value.end_date) {
      return;
    }

    if (value.start_date > value.end_date) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "Başlangıç tarihi bitiş tarihinden büyük olamaz.",
      });
    }
  });

export type CreateAcademicTermInput = z.infer<typeof createAcademicTermSchema>;

export function validateCreateAcademicTermInput(input: Record<string, unknown>) {
  return createAcademicTermSchema.safeParse(input);
}
