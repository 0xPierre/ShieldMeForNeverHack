/**
 * ASCII domain verification service
 * Detects potential IDN homograph attacks using non-ASCII characters
 */

/**
 * Check if a string contains only ASCII characters (0-127)
 * @param {string} str - String to check
 * @returns {boolean} - True if string is ASCII-only
 */
export function isAscii(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

/**
 * Verify that a domain contains only ASCII characters
 * @param {string} domain - Domain to verify
 * @returns {object} - Verification result with details
 */
export function verifyDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return {
      isAscii: false,
      domain,
      error: 'Invalid domain',
    };
  }

  const asciiOnly = isAscii(domain);
  const nonAsciiChars = asciiOnly ? [] : findNonAsciiChars(domain);

  return {
    isAscii: asciiOnly,
    domain,
    nonAsciiChars,
    warning: asciiOnly ? null : 'Domain contains non-ASCII characters (potential IDN homograph attack)',
  };
}

/**
 * Find all non-ASCII characters in a string
 * @param {string} str - String to analyze
 * @returns {Array<object>} - Array of non-ASCII character details
 */
export function findNonAsciiChars(str) {
  const nonAscii = [];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    if (code > 127) {
      nonAscii.push({
        char,
        position: i,
        codePoint: code,
        unicode: `U+${code.toString(16).toUpperCase().padStart(4, '0')}`,
      });
    }
  }
  return nonAscii;
}

