import { z } from "zod";

export const socialAutomationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "O nome é obrigatório."),
  platform: z.enum(['pinterest', 'facebook']),
  is_active: z.boolean(),
  source_category_id: z.string().uuid().nullable().optional(),
  pinterest_board_id: z.string().nullable().optional(),
  image_prompt_template: z.string().min(10, "O prompt da imagem é obrigatório."),
  description_template: z.string().min(10, "O template de descrição é obrigatório."),
  
  frequencyType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido (HH:mm).").optional(),
  dayOfWeek: z.string().optional(),
  dayOfMonth: z.string().optional(),
  frequency_cron_expression: z.string().optional(),
}).refine(data => {
    if (data.platform === 'pinterest') return !!data.pinterest_board_id && data.pinterest_board_id.length > 0;
    return true;
}, { message: "O ID do Board do Pinterest é obrigatório.", path: ['pinterest_board_id'] })
.refine(data => {
    if (data.frequencyType !== 'custom') return !!data.time;
    return true;
}, { message: "A hora é obrigatória.", path: ['time'] });

export type SocialAutomationFormData = z.infer<typeof socialAutomationSchema>;