/**
 * WHOIS service
 */

import { post } from './api.js';

export async function lookup(domain) {
  console.log(domain);
  return post('/whois/lookup', { domain });
}

