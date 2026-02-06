const DonerModel = require("../models/donerModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

 const { sendOtpEmail } = require("../utilityFunctions/nodeMailer");


const donerRegistration = async (req, res) => {
  try {
    const {
      name,
      gender,
      bloodGroup,
      dob,
      weight,
      platelet,
      donationCount,
      district,
      taluk,
      mobile,
      whatsapp,
      email,
      reEmail,
    } = req.body;

    if (
      !name ||
      !gender ||
      !bloodGroup ||
      !dob ||
      !weight ||
      !platelet ||
      donationCount === undefined ||
      !district ||
      !taluk ||
      !mobile ||
      !whatsapp ||
      !email ||
      !reEmail
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 3. Check email match
    if (email !== reEmail) {
      return res.status(400).json({ message: "Emails do not match" });
    }

    // 4. Validate mobile numbers
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobile)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }
    if (!phoneRegex.test(whatsapp)) {
      return res.status(400).json({ message: "Invalid WhatsApp number" });
    }

    // 5. Validate weight
    if (isNaN(weight) || weight < 45) {
      return res.status(400).json({ message: "Weight must be at least 45kg" });
    }

    // 6. Validate donation count
    if (isNaN(donationCount) || donationCount < 0) {
      return res.status(400).json({ message: "Invalid donation count" });
    }

    // 7. Check if user already exists
    const existingDonor = await DonerModel.findOne({ email });
    if (existingDonor) {
      console.log("existing");

      return res
        .status(409)
        .json({ message: "Donor already registered with this email" });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await sendOtpEmail(email, otp);

    // 9. Save donor to DB
    const newDonor = new DonerModel({
      name,
      gender,
      bloodGroup,
      dob,
      weight,
      platelet,
      donationCount,
      district,
      taluk,
      mobile,
      whatsapp,
      email,
      otp,
      otpExpires,
    });

    await newDonor.save();
    console.log("registerd ");

    return res.status(200).json({
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const donorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    // ✅ Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    // 🔍 Check if donor exists
    const donor = await DonerModel.findOne({ email });
    if (!donor) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    console.log("hai..");
    // 🔐 Compare passwords
    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 🎫 Generate JWT
    const token = jwt.sign(
      { id: donor._id, email: donor.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    console.log("token", token);

    // ✅ Success
    return res.status(200).json({
      message: "Login successful",
      token,
      donor: {
        id: donor._id,
        name: donor.name,
        email: donor.email,
        // add other public fields as needed
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ message: "Server error, please try again later." });
  }
};

const getData = async (req, res) => {
  try {
    const _id = req.user.id;
    const userData = await DonerModel.findById(_id).select("-password");
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user: userData });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { donorLogin, donerRegistration, getData };
