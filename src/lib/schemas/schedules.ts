import { z } from "zod";

// Schema de validação para o formulário
export const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "O nome é obrigatório."),
  post_type: z.enum(['devotional', 'thematic', 'summary']),
  theme: z.string().nullable().optional(),
  is_active: z.boolean(),
  publish_automatically: z.boolean(), // Removido .default(false) para corrigir o erro de tipo
  author_id: z.string().uuid("Selecione um autor."),
  category_ids: z.array(z.string().uuid()).nullable().optional(),
  default_image_prompt: z.string().min(10, "O prompt da imagem é obrigatório."),
  
  // Novos campos para a UI amigável
  frequencyType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm).").optional(),
  dayOfWeek: z.string().optional(), // 0-6 (Sun-Sat)
  dayOfMonth: z.string().optional(), // 1-31
  frequency_cron_expression: z.string().optional(), // Mantido para o modo 'custom'
}).refine(data => {
    if (data.post_type === 'thematic') return !!data.theme && data.theme.length > 3;
    return true;
}, { message: "O tema é obrigatório para o tipo 'Estudo Temático'.", path: ['theme'] })
.refine(data => {
    if (data.frequencyType !== 'custom') return !!data.time;
    return true;
}, { message: "A hora é obrigatória.", path: ['time'] })
.refine(data => {
    if (data.frequencyType === 'weekly') return !!data.dayOfWeek;
    return true;
}, { message: "O dia da semana é obrigatório.", path: ['dayOfWeek'] })
.refine(data => {
    if (data.frequencyType === 'monthly') return !!data.dayOfMonth;
    return true;
}, { message: "O dia do mês é obrigatório.", path: ['dayOfMonth'] })
.refine(data => {
    if (data.frequencyType === 'custom') return !!data.frequency_cron_expression && data.frequency_cron_expression.length > 0;
    return true;
}, { message: "A expressão Cron é obrigatória no modo personalizado.", path: ['frequency_cron_expression'] });

export type ScheduleFormData = z.infer<typeof scheduleSchema>;