/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * Common Data Normalization & Hashing Helpers
 */

const crypto = require('crypto');

/**
 * Format a number with leading zeros (default 3 digits: e.g. 001, 042, 999)
 * @param {number|string} num
 * @param {number} size
 * @returns {string}
 */
function padZero(num, size = 3) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return String(num || '').padStart(size, '0');
  const s = String(Math.max(0, n));
  return s.length >= size ? s : s.padStart(size, '0');
}

/**
 * Normalize Vietnamese phone numbers to both E.164 and local formats
 * Handles: +84, 84, 0-prefix, spaces, dashes, parentheses
 * @param {string} phone
 * @returns {{ raw: string, local: string, e164: string, e164Plain: string, isValid: boolean }}
 */
function normalizePhoneVN(phone) {
  const raw = String(phone || '').trim();
  // Remove non-digit characters except leading plus
  let digits = raw.replace(/\D/g, '');

  let local = '';
  let e164Plain = '';
  let e164 = '';
  let isValid = false;

  if (digits.startsWith('84') && digits.length === 11) {
    // 84901234567 -> 0901234567
    local = '0' + digits.slice(2);
    e164Plain = digits;
    e164 = '+' + digits;
  } else if (digits.startsWith('0') && digits.length === 10) {
    // 0901234567 -> 84901234567
    local = digits;
    e164Plain = '84' + digits.slice(1);
    e164 = '+' + e164Plain;
  } else if (digits.length === 9) {
    // 901234567 (missing leading 0)
    local = '0' + digits;
    e164Plain = '84' + digits;
    e164 = '+' + e164Plain;
  } else {
    // Fallback if abnormal
    local = digits;
    e164Plain = digits.startsWith('84') ? digits : '84' + digits;
    e164 = '+' + e164Plain;
  }

  // Validate standard VN mobile prefixes (03, 05, 07, 08, 09) + 8 digits
  const vnMobileRegex = /^0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  isValid = vnMobileRegex.test(local);

  return {
    raw,
    local,
    e164,
    e164Plain,
    isValid,
    toString() {
      return local;
    },
  };
}

/**
 * Remove Vietnamese accents/diacritics
 * @param {string} str
 * @returns {string}
 */
function removeDiacritics(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

/**
 * Split Vietnamese full name into components for Meta CAPI and CRM/ERP
 * Example: "Nguyễn Văn An" -> { fullName: "Nguyễn Văn An", lastName: "Nguyễn", firstName: "An", middleName: "Văn" }
 * @param {string} fullName
 * @returns {{ fullName: string, lastName: string, firstName: string, middleName: string }}
 */
function splitVietnameseName(fullName) {
  const cleanName = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleanName) {
    return { fullName: '', lastName: '', firstName: '', middleName: '' };
  }

  const parts = cleanName.split(' ');
  if (parts.length === 1) {
    return {
      fullName: cleanName,
      lastName: '',
      firstName: parts[0],
      middleName: '',
    };
  }

  const lastName = parts[0];
  const firstName = parts[parts.length - 1];
  const middleName = parts.slice(1, -1).join(' ');

  return {
    fullName: cleanName,
    lastName,
    firstName,
    middleName,
  };
}

/**
 * SHA-256 hex digest helper with auto-lowercase & trim for CAPI privacy & audit hashing
 * @param {string|number} data
 * @returns {string}
 */
function sha256Hex(data) {
  if (data === undefined || data === null) return '';
  const clean = String(data).trim().toLowerCase();
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * Clean CCCD / CMND string (remove spaces, dots, dashes)
 * @param {string} cccd
 * @returns {string}
 */
function cleanCCCD(cccd) {
  return String(cccd || '').replace(/\D/g, '').trim();
}

function cleanCCCDLast4(val) {
  const digits = String(val || '').replace(/\D/g, '');
  return digits.length >= 4 ? digits.slice(-4) : digits;
}

module.exports = {
  padZero,
  normalizePhoneVN,
  removeDiacritics,
  splitVietnameseName,
  sha256Hex,
  cleanCCCD,
  cleanCCCDLast4,
};
