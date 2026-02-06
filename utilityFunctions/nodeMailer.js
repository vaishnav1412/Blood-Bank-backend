const nodemailer = require("nodemailer");

const sendPasswordEmail = async (to, password) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `Lifecode 🩸" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Lifecode Account Password",
      html: `
        <h2>Welcome to Lifecode❤️!</h2>
        <p>Your registration was successful. Please find your login credentials below:</p>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p>Login here: <a href="https://your-app-url/login">Hemocell Login</a></p>
        <br>
        <p>Note: For security reasons, please change your password after logging in.</p>
      `,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

module.exports = sendPasswordEmail;
