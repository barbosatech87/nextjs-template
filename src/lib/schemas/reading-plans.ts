import { z } from "zod";

export const predefinedPlanSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "O nome do plano deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  books: z.array(z.string()).min(1, "Você deve selecionar pelo menos um livro."),
  duration: z.coerce.number().min(1, "A duração deve ser de pelo menos 1 dia."),
  is_public: z.boolean().default(true),
});

export type PredefinedPlanFormData = z.infer<typeof predefinedPlanSchema>;