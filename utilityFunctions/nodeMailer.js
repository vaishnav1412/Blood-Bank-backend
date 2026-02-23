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
const sendOtpEmail = async (email, otp, purpose) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    if (purpose === "register") {
      await transporter.sendMail({
        from: `"Lifecode 🩸" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email - Lifecode OTP",
        
        // ✅ FIX: Change 'messageHtml' to 'html'
        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h2 style="color: #e11d48;">🩸 Email Verification OTP</h2>
            <p>Hello Donor 👋</p>
            <p>Thank you for registering with <b>Lifecode</b>.</p>
            <p>Your OTP code is:</p>

            <h1 style="letter-spacing: 6px; color: #e11d48;">
              ${otp}
            </h1>

            <p>This OTP is valid for <b>5 minutes</b>.</p>
            <p>Please do not share this OTP with anyone.</p>
          </div>
        `
      });
    }

    // ✅ Forgot Password OTP
    else if (purpose === "password_reset") {
      await transporter.sendMail({
        from: `"Lifecode 🩸" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset Password OTP - Lifecode",

        // ✅ FIX: Change 'messageHtml' to 'html'
        html: `
          <div style="font-family: Arial; padding: 20px;">
            <h2 style="color: #2563eb;">🔐 Password Reset OTP</h2>
            <p>Hello 👋</p>

            <p>We received a request to reset your Lifecode account password.</p>

            <p>Your OTP code is:</p>

            <h1 style="letter-spacing: 6px; color: #2563eb;">
              ${otp}
            </h1>

            <p>This OTP is valid for <b>10 minutes</b>.</p>

            <p>If you did not request this, please ignore this email.</p>
          </div>
        `
      });
    } else {
      throw new Error("Invalid OTP purpose provided.");
    }

  } catch (error) {
    console.error("❌ OTP Email failed:", error);
    throw error;
  }
};


const sendReplyEmail = async (to, name, subject, replyMessage) => {
  try {

     const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    await transporter.sendMail({
      from: `"Lifecode Support 🩸" <${process.env.EMAIL_USER}>`,
      to,
      subject: `Reply to your query: ${subject}`,
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color:#e11d48;">🩸 Lifecode Support Reply</h2>
          <p>Hello ${name},</p>

          <p>${replyMessage}</p>

          <br/>
          <p>If you have further questions, feel free to reply back.</p>

          <p>Regards,<br/><strong>Lifecode Support Team</strong></p>
        </div>
      `,
    });

    console.log("✅ Reply Email sent successfully!");

  } catch (error) {
    console.error("❌ Reply Email failed:", error);
    throw error;
  }
};
// ✅ Export Both Functions
module.exports = {
  sendPasswordEmail,
  sendOtpEmail,
  sendReplyEmail
};
