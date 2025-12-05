/**
 * GeoIP service
 */

import { post } from './api.js';

export async function getCountry(ip) {
  return post('/geo/lookup', { ip_address: ip });
}

export async function getCountryByDomain(domain) {
  return post('/geo/lookup-domain', { domain: domain });
}

