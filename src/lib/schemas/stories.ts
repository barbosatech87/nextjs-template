import { z } from "zod";

export const storyAutomationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "O nome é obrigatório."),
  platform: z.enum(['pinterest']),
  is_active: z.boolean(),
  pinterest_board_id: z.string().min(5, "O ID do Board do Pinterest é obrigatório."),
  
  // Novos campos para a automação de criação
  source_category_id: z.string().uuid().nullable().optional(),
  number_of_pages: z.coerce.number().min(3, "Mínimo de 3 páginas.").max(15, "Máximo de 15 páginas."),
  add_post_link_on_last_page: z.boolean(),
  publish_automatically: z.boolean(),

  // Campos de frequência
  frequencyType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm).").optional(),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.string().optional(),
  frequency_cron_expression: z.string().optional(),
}).refine(data => {
    if (data.frequencyType !== 'custom') return !!data.time;
    return true;
}, { message: "A hora é obrigatória.", path: ['time'] });

export type StoryAutomationFormData = z.infer<typeof storyAutomationSchema>;