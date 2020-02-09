/**
 * a function that generates a random alphanumeric string
 * @param {number} length
 * @returns {string} the random string
 */
const generateRandomString = (length = 5) => {
  let randomString = '';
  const chars = 'abcdefghijklmnopqrstuvwxyz123456789';
  for (let i = 0; i < length; i++) {
    const randomIdx = Math.floor(Math.random() * chars.length);
    randomString += chars[randomIdx];
  }
  return randomString;
}

module.exports = {
  generateRandomString,
};
