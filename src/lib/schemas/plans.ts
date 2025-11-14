import { z } from "zod";
import { Locale } from "@/lib/i18n/config";

export const createPlanSchema = z.object({
  name: z.string().min(3, "O nome do plano deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  books: z.array(z.string()).min(1, "Você deve selecionar pelo menos um livro."),
  duration: z.coerce.number().min(1, "A duração deve ser de pelo menos 1 dia."),
  lang: z.custom<Locale>(),
});

export type CreatePlanData = z.infer<typeof createPlanSchema>;