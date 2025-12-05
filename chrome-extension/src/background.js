/**
 * Background service worker
 * Runs calculations automatically when pages load
 */

import { extractDomain } from './services/domain.js';
import { verifyDomain } from './services/ascii.js';
import { checkDomain as checkPhishing } from './services/phishing.js';
import { lookup as whoisLookup } from './services/whois.js';

/**
 * Get the icon path based on the grade
 * @param {number} grade - The grade value (0-100)
 * @returns {object} - Icon path object with sizes
 */
function getIconForGrade(grade) {
  let iconName;
  if (grade >= 80) iconName = 'VERT';
  else if (grade >= 60) iconName = 'BLUE';
  else if (grade >= 50) iconName = 'ORANGE';
  else iconName = 'RED';
  
  return {
    "255": `./icons/BLUE.png`
  };
}

/**
 * Update the extension icon based on the grade
 * @param {number} grade - The grade value (0-100)
 */
async function updateIcon(grade) {
    // TODO: Fix icon update
//   try {
//     const iconPath = getIconForGrade(grade);
//     await chrome.action.setIcon({ path: iconPath });
//     console.log('[Background] Icon updated to:', iconPath);
//   } catch (error) {
//     console.error('[Background] Error updating icon:', error);
//   }
}

/**
 * Count external domains on a page
 */
async function countExternalDomains(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
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
        };

        function extractDomain(url) {
          try {
            const { hostname } = new URL(url);
            return hostname;
          } catch {
            return null;
          }
        }

        function getUrlFromElement(element) {
          if (element.src) return element.src;
          if (element.href) return element.href;
          if (element.data) return element.data;
          if (element.action) return element.action;
          return null;
        }

        const domains = new Set();
        const currentDomain = extractDomain(document.location.href);

        for (const selector of Object.values(RESOURCE_SELECTORS)) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const url = getUrlFromElement(element);
            if (!url) continue;
            const domain = extractDomain(url);
            if (domain && domain !== currentDomain && !domain.endsWith(`.${currentDomain}`)) {
              domains.add(domain);
            }
          }
        }

        return domains.size;
      },
    });

    if (results && results[0] && results[0].result !== undefined) {
      return results[0].result;
    }
    return 0;
  } catch (error) {
    console.error('Error counting external domains:', error);
    return 0;
  }
}

/**
 * Calculate grade based on all checks
 */
async function calculateGrade(tabId, url) {
  const domain = extractDomain(url);
  if (!domain) return null;

  // Skip chrome:// and other internal URLs
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('about:')) {
    return null;
  }

  console.log('[Background] Calculating grade for:', domain);

  let grade = 100;
  const results = {
    domain,
    timestamp: Date.now(),
    checks: {}
  };

  // 1. ASCII check (IDN homograph detection)
  try {
    const asciiResult = verifyDomain(domain);
    results.checks.ascii = asciiResult;
    if (!asciiResult.isAscii) {
      grade -= 25;
    }
  } catch (error) {
    console.error('[Background] ASCII check error:', error);
    results.checks.ascii = { error: error.message };
  }

  // 2. Phishing check
  try {
    const phishingResult = await checkPhishing(domain);
    results.checks.phishing = phishingResult;
    if (phishingResult.phishing) {
      grade -= 70;
    }
  } catch (error) {
    console.error('[Background] Phishing check error:', error);
    results.checks.phishing = { error: error.message };
  }

  // 3. WHOIS lookup
  try {
    const whoisResult = await whoisLookup(domain);
    results.checks.whois = whoisResult;
    
    if (whoisResult.creation_date) {
      let creationDate = whoisResult.creation_date;
      if (typeof creationDate === 'object') {
        creationDate = creationDate[0];
      }
      const match = creationDate.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [_, y, m, d] = match;
        const date = new Date(`${y}-${m}-${d}T00:00:00Z`);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const score = Math.max(0, 30 - diffDays);
        grade -= score;
      }
    }
  } catch (error) {
    console.error('[Background] WHOIS error:', error);
    results.checks.whois = { error: error.message };
  }

  // 4. External domains count
  try {
    const externalCount = await countExternalDomains(tabId);
    results.checks.externalDomains = { count: externalCount };
    
    if (externalCount >= 50) {
      grade -= 45;
    } else if (externalCount >= 30) {
      grade -= 35;
    } else if (externalCount >= 10) {
      grade -= 25;
    } else if (externalCount >= 5) {
      grade -= 15;
    }
  } catch (error) {
    console.error('[Background] External domains error:', error);
    results.checks.externalDomains = { error: error.message };
  }

  // Ensure grade is between 0 and 100
  grade = Math.max(0, Math.min(100, grade));
  results.grade = grade;

  console.log('[Background] Final grade:', grade);

  return results;
}

/**
 * Store results in chrome.storage.local
 */
async function storeResults(domain, results) {
  const key = `grade_${domain}`;
  await chrome.storage.local.set({ [key]: results });
  console.log('[Background] Stored results for:', domain);
}

/**
 * Listen for tab updates
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only run when the page finishes loading
  if (changeInfo.status === 'complete' && tab.url) {
    const results = await calculateGrade(tabId, tab.url);
    if (results) {
      await storeResults(results.domain, results);
      await updateIcon(results.grade);
    }
  }
});

/**
 * Also calculate on tab activation (switching tabs)
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.status === 'complete') {
      const domain = extractDomain(tab.url);
      if (!domain) return;
      
      // Check if we already have recent results
      const key = `grade_${domain}`;
      const stored = await chrome.storage.local.get(key);
      
      // If no results or older than 5 minutes, recalculate
      if (!stored[key] || (Date.now() - stored[key].timestamp) > 5 * 60 * 1000) {
        const results = await calculateGrade(activeInfo.tabId, tab.url);
        if (results) {
          await storeResults(results.domain, results);
          await updateIcon(results.grade);
        }
      } else {
        // Use cached grade to update icon
        await updateIcon(stored[key].grade);
      }
    }
  } catch (error) {
    console.error('[Background] Tab activation error:', error);
  }
});

console.log('[Background] Service worker started');

