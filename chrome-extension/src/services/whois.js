/**
 * WHOIS service
 */

import { get } from './api.js';

export async function lookup(domain) {
  return get(`/whois/${domain}`);
}

