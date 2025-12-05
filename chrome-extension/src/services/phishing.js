/**
 * Phishing detection service
 */

import { post } from './api.js';

/**
 * Check if a domain is a known phishing domain
 * @param {string} domain - The domain to check
 * @returns {Promise<{phishing: boolean}>} - Whether the domain is a phishing domain
 */
export async function checkDomain(domain) {
    console.log('Checking phishing for domain:', domain);
  return post('/phishing/check-domain-phishing', { domain });
}

