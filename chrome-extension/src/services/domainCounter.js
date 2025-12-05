/**
 * Domain counter service
 * Analyzes page resources to count unique domains
 */

import { extractDomain, getBaseDomain } from './domain.js';

/**
 * Selectors for elements that can load external resources
 */
const RESOURCE_SELECTORS = {
  scripts: 'script[src]',
  images: 'img[src]',
  stylesheets: 'link[rel="stylesheet"][href]',
  links: 'a[href]',
  iframes: 'iframe[src]',
  videos: 'video[src], video source[src]',
  audio: 'audio[src], audio source[src]',
  objects: 'object[data]',
  embeds: 'embed[src]',
  forms: 'form[action]',
  preload: 'link[rel="preload"][href], link[rel="prefetch"][href]',
  fonts: 'link[rel="preload"][as="font"][href]',
};

/**
 * Extract URL attribute from an element based on its type
 */
function getUrlFromElement(element) {
  if (element.src) return element.src;
  if (element.href) return element.href;
  if (element.data) return element.data;
  if (element.action) return element.action;
  return null;
}

/**
 * Count all unique domains used in the page
 * @param {Document} doc - The document to analyze (defaults to current document)
 * @returns {Object} Domain count results
 */
export function countDomains(doc = document) {
  const domains = new Map(); // domain -> { count, sources }
  const currentDomain = extractDomain(doc.location.href);

  // Process all resource types
  for (const [type, selector] of Object.entries(RESOURCE_SELECTORS)) {
    const elements = doc.querySelectorAll(selector);
    
    for (const element of elements) {
      const url = getUrlFromElement(element);
      if (!url) continue;

      const domain = extractDomain(url);
      if (!domain) continue;

      if (!domains.has(domain)) {
        domains.set(domain, { count: 0, sources: new Set() });
      }
      
      const entry = domains.get(domain);
      entry.count++;
      entry.sources.add(type);
    }
  }

  // Convert to result object
  const domainList = Array.from(domains.entries()).map(([domain, data]) => ({
    domain,
    baseDomain: getBaseDomain(domain),
    count: data.count,
    sources: Array.from(data.sources),
    isFirstParty: domain === currentDomain || domain.endsWith(`.${currentDomain}`),
  }));

  // Sort by count descending
  domainList.sort((a, b) => b.count - a.count);

  const thirdPartyDomains = domainList.filter(d => !d.isFirstParty);
  const firstPartyDomains = domainList.filter(d => d.isFirstParty);

  return {
    currentDomain,
    totalDomains: domainList.length,
    totalResources: domainList.reduce((sum, d) => sum + d.count, 0),
    firstParty: {
      count: firstPartyDomains.length,
      domains: firstPartyDomains,
    },
    thirdParty: {
      count: thirdPartyDomains.length,
      domains: thirdPartyDomains,
    },
    all: domainList,
  };
}

/**
 * Get unique base domains (e.g., google.com instead of www.google.com)
 * @param {Document} doc - The document to analyze
 * @returns {Object} Unique base domain results
 */
export function countBaseDomains(doc = document) {
  const result = countDomains(doc);
  
  const baseDomains = new Map();
  
  for (const entry of result.all) {
    const base = entry.baseDomain;
    if (!baseDomains.has(base)) {
      baseDomains.set(base, {
        baseDomain: base,
        subdomains: [],
        totalCount: 0,
        sources: new Set(),
        isFirstParty: entry.isFirstParty,
      });
    }
    
    const data = baseDomains.get(base);
    data.subdomains.push(entry.domain);
    data.totalCount += entry.count;
    entry.sources.forEach(s => data.sources.add(s));
  }

  const baseList = Array.from(baseDomains.values()).map(d => ({
    ...d,
    sources: Array.from(d.sources),
  }));

  baseList.sort((a, b) => b.totalCount - a.totalCount);

  return {
    currentDomain: result.currentDomain,
    totalBaseDomains: baseList.length,
    totalResources: result.totalResources,
    firstParty: baseList.filter(d => d.isFirstParty),
    thirdParty: baseList.filter(d => !d.isFirstParty),
    all: baseList,
  };
}

/**
 * Get a summary of domain usage for display
 * @param {Document} doc - The document to analyze
 * @returns {Object} Summary statistics
 */
export function getDomainSummary(doc = document) {
  const result = countDomains(doc);
  
  return {
    currentDomain: result.currentDomain,
    total: result.totalDomains,
    firstParty: result.firstParty.count,
    thirdParty: result.thirdParty.count,
    totalResources: result.totalResources,
    topThirdParty: result.thirdParty.domains.slice(0, 5).map(d => d.domain),
  };
}

