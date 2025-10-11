import { z } from "zod";

type Env = {
  RESEND_API_KEY: string;
  RESEND_FROM?: string;
  RESEND_TO?: string;
};

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  subject: z.string().max(160).optional().default(""),
  message: z.string().min(10).max(4000),
});

async function sendEmail(apiKey: string, payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err?.message === "string" ? err.message : res.statusText);
  }
}

export const onRequestPost = async ({
  request,
  env,
  waitUntil,
}: {
  request: Request;
  env: Env;
  waitUntil?: (promise: Promise<unknown>) => void;
}) => {
  if (!env.RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ ok: false, error: "Resend is not configured." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid JSON payload." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ ok: false, error: parsed.error.message }),
      { status: 422, headers: { "content-type": "application/json" } },
    );
  }

  const { name, email, subject, message } = parsed.data;
  const toAddress = env.RESEND_TO || env.RESEND_FROM;
  if (!toAddress) {
    return new Response(
      JSON.stringify({ ok: false, error: "RESEND_TO or RESEND_FROM must be configured." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "0.0.0.0";
  const ua = request.headers.get("user-agent") || "";

  try {
    await sendEmail(env.RESEND_API_KEY, {
      from: env.RESEND_FROM ?? "Portfolio <notifications@resend.dev>",
      to: [toAddress],
      reply_to: email,
      subject: subject ? `New message: ${subject}` : "New message",
      text: `From: ${name} <${email}>\nIP: ${ip}\nUA: ${ua}\n\n${message}`,
    });

    waitUntil?.(
      sendEmail(env.RESEND_API_KEY, {
        from: env.RESEND_FROM ?? "Portfolio <notifications@resend.dev>",
        to: [email],
        subject: "Thanks for reaching out 👋",
        text: `Hey ${name},\n\nThanks for the message — I'll reply soon.\n\n– Adeyemi`,
      }).catch(() => undefined),
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const messageText = err instanceof Error ? err.message : "Failed to send message.";
    return new Response(
      JSON.stringify({ ok: false, error: messageText }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
};

export const onRequestOptions = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
