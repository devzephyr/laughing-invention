"use client";

import { useTransition, useState, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendMessage } from "@/app/actions/sendMessage";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Script from "next/script";

const Schema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  subject: z.string().max(160).optional(),
  message: z.string().min(10, "Please provide a bit more detail"),
});

export default function ContactPage() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const form = useForm<z.infer<typeof Schema>>({ resolver: zodResolver(Schema), defaultValues: { name: "", email: "", subject: "", message: "" } });
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-4">Contact</h1>
        {/* Cloudflare Turnstile (optional). Provide NEXT_PUBLIC_TURNSTILE_SITE_KEY to enable. */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        ) : null}
        <Form {...form}>
          <form ref={formRef} className="space-y-4" onSubmit={form.handleSubmit((_values) => {
            const fd = new FormData(formRef.current!);
            startTransition(async () => {
              try {
                await sendMessage(fd);
                setStatus('Sent. Check your inbox!');
                form.reset();
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Something went wrong.';
                setStatus(msg);
              }
            });
          })}>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl><Input placeholder="Your name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>Subject (optional)</FormLabel>
                <FormControl><Input placeholder="How can I help?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl><Textarea rows={6} placeholder="Tell me about the project…" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
              <div className="pt-2">
                <div
                  className="cf-turnstile"
                  data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  data-theme="auto"
                />
              </div>
            ) : null}
            <Button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Send'}</Button>
          </form>
        </Form>
        {status && <p className="mt-3 text-sm opacity-80">{status}</p>}
      </div>
    </main>
  );
}
