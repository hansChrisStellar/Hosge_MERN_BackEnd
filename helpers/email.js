import nodemailer from "nodemailer";

export const registerEmail = async (data) => {
  const { email, name, token } = data;
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email information

  const info = await transport.sendMail({
    from: '"Hosge - Projects Administrator" <accounts@hosge.co.uk>',
    to: email,
    subject: "Hosge - Confirm your account",
    text: "Confirm your account in Hosge",
    html: `<p>Hello: ${name}, this is an automated email from Hosge</p>
    <p>Your account is almost set, click in the following link to complete the process: </p>
    <a href="${process.env.FRONTEND_URL}/confirm/${token}">Confirm your account</a>
    `,
  });
};

export const forgotPassword = async (data) => {
  const { email, name, token } = data;

  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email information

  const info = await transport.sendMail({
    from: '"Hosge - Projects Administrator" <accounts@hosge.co.uk>',
    to: email,
    subject: "Hosge - Reset your password",
    text: "Reset your password",
    html: `<p>Hello: ${name}, Hello, you have requested to reset your password</p>
      <p>
      Click on the following link to generate a new password: </p>
      <a href="${process.env.FRONTEND_URL}/forgot-password/${token}">Reset your password</a>
      `,
  });
};
