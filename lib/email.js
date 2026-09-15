"use client";

export async function sendEmail(toEmail, name, subject, message) {
  if (!toEmail) return;
  try {
    await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: toEmail,
          name: name || "there",
          subject,
          message,
        },
      }),
    });
  } catch (e) {
    console.error("Email send failed", e);
  }
}
