const htmlEscape = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const responsePage = (message: string, returnUrl: string, status: number): Response =>
  new Response(
    `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurex - Message status</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(160deg, #113050, #060b14); color: #fff; font: 18px/1.6 Arial, sans-serif; }
      main { width: min(520px, calc(100% - 48px)); padding: 32px; border: 1px solid rgb(153 151 203 / 35%); border-radius: 12px; background: rgb(255 255 255 / 5%); }
      h1 { margin-top: 0; color: #ff5900; }
      a { color: #ff5900; }
    </style>
  </head>
  <body>
    <main>
      <h1>${status < 400 ? "Thanks for reaching out." : "We couldn't send your message."}</h1>
      <p>${message}</p>
      <a href="${htmlEscape(returnUrl)}">Return to Aurex</a>
    </main>
  </body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const configuredReturnUrl = Deno.env.get("AUREX_RETURN_URL");
  if (!supabaseUrl || !serviceRoleKey || !configuredReturnUrl) {
    console.error("Contact function is missing required environment configuration.");
    return new Response("Contact form is not configured.", { status: 500 });
  }

  let returnUrl: string;
  try {
    const parsedReturnUrl = new URL(configuredReturnUrl);
    if (parsedReturnUrl.protocol !== "https:" && parsedReturnUrl.hostname !== "localhost") {
      throw new Error("Return URL must use HTTPS.");
    }
    returnUrl = parsedReturnUrl.href;
  } catch (error) {
    console.error("Contact function has an invalid AUREX_RETURN_URL.", error);
    return new Response("Contact form is not configured.", { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return responsePage("Please submit the contact form and try again.", returnUrl, 400);
  }

  const readField = (name: string): string => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  };

  if (readField("website")) {
    return responsePage("Your message has been received.", returnUrl, 200);
  }

  const name = readField("name");
  const email = readField("email");
  const subject = readField("subject");
  const message = readField("message");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (
    name.length < 1 ||
    name.length > 120 ||
    !validEmail ||
    email.length > 254 ||
    subject.length < 1 ||
    subject.length > 160 ||
    message.length < 1 ||
    message.length > 5000
  ) {
    return responsePage("Check the form fields and try submitting again.", returnUrl, 400);
  }

  try {
    const insertResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/contact_messages`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ name, email, subject, message }),
    });

    if (!insertResponse.ok) {
      console.error(`Contact message insert failed with HTTP ${insertResponse.status}.`);
      return responsePage("Please try again later or email hello@aurex.com.", returnUrl, 502);
    }
  } catch (error) {
    console.error("Contact message insert failed.", error);
    return responsePage("Please try again later or email hello@aurex.com.", returnUrl, 502);
  }

  return responsePage("Your message has been received. Our team will be in touch.", returnUrl, 200);
});
