const { Resend } = require("resend");
const { resendApiKey, emailFrom, appUrl } = require("../config/env");

const resend = resendApiKey ? new Resend(resendApiKey) : null;

async function sendMagicLink(email, token) {
  const url = `${appUrl}/auth/verify?token=${token}`;

  if (!resend) {
    console.log(`[DEV] Magic link for ${email}: ${url}`);
    return;
  }

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: "Sign in to Tidebound",
    html: `<p>Click <a href="${url}">here</a> to sign in to Tidebound.</p><p>This link expires in 15 minutes.</p>`
  });
}

module.exports = { sendMagicLink };
