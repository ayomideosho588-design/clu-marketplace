"use client";
import emailjs from "@emailjs/browser";

export async function sendEmail(toEmail, name, subject, message) {
  if (!toEmail) return;
  try {
    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      {
        to_email: toEmail,
        name: name || "there",
        subject,
        message,
      },
      { publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY }
    );
  } catch (e) {
    console.error("Email send failed", e);
  }
}
