"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2, "Please enter at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().max(160, "Subject is too long").optional(),
  message: z.string().min(10, "Please include a few more details"),
});

type FormValues = z.infer<typeof schema>;

export function ContactPage() {
  const [status, setStatus] = useState<{ state: "idle" | "pending" | "success" | "error"; message?: string }>({ state: "idle" });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  async function onSubmit(values: FormValues) {
    setStatus({ state: "pending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }
      form.reset();
      setStatus({ state: "success", message: "Thanks! Your message is on its way." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setStatus({ state: "error", message });
    }
  }

  return (
    <section className="flex min-h-[80vh] w-full items-center justify-center px-6 py-16 sm:py-20">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s talk</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Fill out the form and I&apos;ll get back to you as soon as possible.
          </p>
        </div>
        <Form {...form}>
          <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ada Lovelace" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Quick intro" {...field} />
                  </FormControl>
                  <FormDescription>Let me know what this is about.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="Tell me about the project or opportunity..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={status.state === "pending"} className="bg-emerald-500 text-neutral-950 hover:bg-emerald-400">
              {status.state === "pending" ? "Sending…" : "Send message"}
            </Button>
          </form>
        </Form>
        {status.state !== "idle" && status.message && (
          <p
            className={
              status.state === "success"
                ? "text-sm font-medium text-emerald-600"
                : "text-sm font-medium text-rose-600"
            }
          >
            {status.message}
          </p>
        )}
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Message delivery is powered by Resend. Double-check your email address so I can respond directly.
        </p>
      </div>
    </section>
  );
}
