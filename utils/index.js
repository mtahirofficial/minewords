function isObjectEmpty(obj = {}) {
  return !Object.keys(obj).length;
}

function rejectObjEmpty(obj = {}) {
  return isObjectEmpty(obj) ? null : obj;
}

function generateOTP(otp_length) {
  let digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < otp_length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

function generateRandomString(length) {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-';
  const charactersLength = characters.length;
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

function getSecondBetween2Date(d1, d2) {
  return (new Date(d2).getTime() - new Date(d1).getTime()) / 1000;
}

function randomPassword(_length) {
  let chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  let pw = "";

  for (let i = 0; i <= _length; i++) {
    let randomNumber = Math.floor(Math.random() * chars.length);
    pw += chars.substring(randomNumber, randomNumber + 1);
  }

  return pw;
}

function dateDifferenceInDays(first, second) {
  const timeDiff = first.getTime() - second.getTime();
  return Math.abs(Math.floor(timeDiff / (1000 * 3600 * 24)));
}
function calculateTrial(days, date) {
  // let trialDays = days
  // let remainingDays = days
  let createdAt = new Date(date);
  let current = new Date();
  const passedDays = dateDifferenceInDays(current, createdAt)
  const trialDays = days - passedDays
  return trialDays < 3 ? 0 : trialDays
}

const capitalize = text => text?.replace(/^./, str => str.toUpperCase())

const checkParamIsPresent = obj => {
  const values = Object.values(obj)
  return values.some(value => value !== undefined && value !== null && value !== '')
};

function daysToDate(days, zone) {
  const currentDate = new Date().toLocaleString("en-US", { timeZone: zone });;
  const targetDate = new Date(currentDate); // Clone the current date
  targetDate.setDate(targetDate.getDate() + days); // Add/subtract days
  return formatDateToCustomFormat(targetDate);
}

function formatDateToCustomFormat(isoString) {
  const date = new Date(isoString);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');  // Month is 0-based
  const day = String(date.getUTCDate()).padStart(2, '0');

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} 23:59:59 +0000`;
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0000`;
}

function getFormattedDeliveryRange({ minDays = -1, maxDays = -1 }) {
  const options = { month: 'long', day: 'numeric' };
  const currentDate = new Date();

  const toReturn = {}
  if (minDays > -1) {
    const minDate = new Date(currentDate);
    minDate.setDate(currentDate.getDate() + Number(minDays));
    const minFormatted = minDate.toLocaleDateString('en-US', options);
    toReturn.min = minFormatted
  }
  if (maxDays > -1) {
    const maxDate = new Date(currentDate);
    maxDate.setDate(currentDate.getDate() + Number(maxDays));
    const maxFormatted = maxDate.toLocaleDateString('en-US', options);
    toReturn.max = maxFormatted
  }

  return toReturn;
}
function sortNumericStrings(arr) {
  return arr.sort((a, b) => a - b);
}
function getUniqueValues(arr) {
  return [...new Set(arr)];
}

function sortMixedArray(arr) {
  return arr.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateReadTime(text = "") {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

module.exports = {
  isObjectEmpty,
  rejectObjEmpty,
  generateOTP,
  getSecondBetween2Date,
  randomPassword,
  generateRandomString,
  capitalize,
  dateDifferenceInDays,
  calculateTrial,
  checkParamIsPresent,
  daysToDate,
  formatDateToCustomFormat,
  getFormattedDeliveryRange,
  sortNumericStrings,
  getUniqueValues,
  sortMixedArray,
  sleep,
  calculateReadTime
};
