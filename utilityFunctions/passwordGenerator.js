const crypto = require("crypto");

function generateStrongPassword(length = 12) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+";

  const allChars = uppercase + lowercase + numbers + symbols;

  const getRandomChar = (chars) =>
    chars[crypto.randomInt(0, chars.length)];

  let passwordArray = [
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(numbers),
    getRandomChar(symbols),
  ];

  for (let i = 4; i < length; i++) {
    passwordArray.push(getRandomChar(allChars));
  }

  // 🔐 Secure shuffle
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("");
}

module.exports = generateStrongPassword;