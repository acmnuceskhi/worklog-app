import { EmailTemplate } from "../../../components/email-template";
import { Resend } from "resend";
import * as React from "react";

// Only initialize if API key exists (for testing purposes)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST() {
  if (!resend) {
    return Response.json(
      { error: "RESEND_API_KEY not configured" },
      { status: 503 }
    );
  }

  const emailComponent = <EmailTemplate firstName="John" />;

  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: "Hello world",
      react: emailComponent,
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
