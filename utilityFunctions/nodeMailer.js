const nodemailer = require("nodemailer");

// ✅ Send Password Email
const sendPasswordEmail = async (to, password) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // recommended
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Lifecode 🩸" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Lifecode Account Password",
      html: `
        <h2>Welcome to Lifecode ❤️!</h2>
        <p>Your registration was successful.</p>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Password:</strong> ${password}</p>
        <br/>
        <p>Please change your password after login.</p>
      `,
    });

    console.log("✅ Password Email sent successfully!");
  } catch (error) {
    console.error("❌ Password Email failed:", error);
    throw error;
  }
};

// ✅ Send OTP Email
const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Blood Bank Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #e11d48;">Email Verification OTP</h2>
          <p>Hello Donor 👋</p>
          <p>Your OTP is:</p>
          <h1 style="letter-spacing: 5px;">${otp}</h1>
          <p>This OTP is valid for <b>5 minutes</b>.</p>
        </div>
      `,
    });

    console.log("✅ OTP Email sent successfully!");
  } catch (error) {
    console.error("❌ OTP Email failed:", error);
    throw error;
  }
};

// ✅ Export Both Functions
module.exports = {
  sendPasswordEmail,
  sendOtpEmail,
};
