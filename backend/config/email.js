const sgMail = require("@sendgrid/mail");

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) return false;
  sgMail.setApiKey(apiKey);
  configured = true;
  return true;
}

/**
 * Sends the "you've been invited to a group" email.
 * @param {Object} params
 * @param {string} params.to 
 * @param {string} params.groupName
 * @param {string} params.inviterName
 * @param {string} params.token 
 */
async function sendInviteEmail({ to, groupName, inviterName, token }) {
  if (!ensureConfigured()) {
    console.warn(
      `[email] SENDGRID_API_KEY not set - skipping real send. ` +
        `Invite link for ${to}: ${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/invitations/${token}/accept`
    );
    return { sent: false, reason: "not_configured" };
  }

  const acceptUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/invitations/${token}/accept`;

  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `${inviterName} invited you to join "${groupName}" on CrewUp`,
    text: `${inviterName} invited you to join the group "${groupName}" on CrewUp.\n\nAccept the invite: ${acceptUrl}\n\nThis link expires in 7 days.`,
    html: `
      <p>${inviterName} invited you to join the group <strong>${groupName}</strong> on CrewUp.</p>
      <p><a href="${acceptUrl}">Accept the invite</a></p>
      <p style="color:#666;font-size:13px;">This link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    return { sent: true };
  } catch (err) {

    console.error("[email] SendGrid send failed:", err.response?.body || err.message);
    return { sent: false, reason: "send_failed" };
  }
}

module.exports = { sendInviteEmail };