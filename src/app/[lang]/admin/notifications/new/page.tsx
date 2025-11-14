"use client";

import { z } from "zod";
import { useTransition, use } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendNotificationToAll } from "@/app/actions/notifications";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Locale } from "@/lib/i18n/config";

const schema = z.object({
  title: z.string().min(1, { message: "O título é obrigatório." }),
  body: z.string().min(1, { message: "A mensagem é obrigatória." }),
});

export default function AdminNotificationsPage({ params: paramsProp }: { params: { lang: Locale } }) {
  const params = use(paramsProp as any);
  const { lang } = params;

  const [isPending, startTransition] = useTransition();

  const t = {
    pt: {
      heading: "Enviar Notificação",
      title: "Título",
      body: "Mensagem",
      send: "Enviar para todos",
      help: "Dispara uma notificação para todos os usuários. Envio por e-mail será adicionado futuramente.",
      success: (n: number) => `Notificação enviada para ${n} usuário(s).`,
    },
    en: {
      heading: "Send Notification",
      title: "Title",
      body: "Message",
      send: "Send to all",
      help: "Sends a notification to all users. Email delivery will be added later.",
      success: (n: number) => `Notification sent to ${n} user(s).`,
    },
    es: {
      heading: "Enviar Notificación",
      title: "Título",
      body: "Mensaje",
      send: "Enviar a todos",
      help: "Envía una notificación a todos los usuarios. El envío por correo se agregará más tarde.",
      success: (n: number) => `Notificación enviada a ${n} usuario(s).`,
    },
  }[lang] ?? {
    heading: "Enviar Notificação",
    title: "Título",
    body: "Mensagem",
    send: "Enviar para todos",
    help: "Dispara uma notificação para todos os usuários. Envio por e-mail será adicionado futuramente.",
    success: (n: number) => `Notificação enviada para ${n} usuário(s).`,
  };

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    startTransition(async () => {
      const res = await sendNotificationToAll(values.title, values.body);
      toast.success(t.success(res.count));
      form.reset();
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.heading}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.help}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.title}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t.title} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.body}</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={t.body} rows={6} />
                </FormControl>
                <FormDescription />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            {t.send}
          </Button>
        </form>
      </Form>
    </div>
  );
}