import { getCountry, getCountryByDomain } from "../services/geoip.js";
import { whois, phishing } from "../services/index.js";
import { extractDomain, getBaseDomain } from "../services/domain.js";
import { addTagToEmail, autoCompleteEmail } from "../services/mail.js";
import {verifyDomain} from "../services/ascii.js";

let nbLoaded, grade;

// Promise that resolves to cached data or null
let cacheCheckPromise = null;

document.addEventListener('DOMContentLoaded', () => {
  nbLoaded = 4;
  grade = 100;
  
  // Start the cache check immediately
  cacheCheckPromise = loadCachedResults();
});

/**
 * Check if all grades are loaded and animate the rating
 */
function checkAndAnimateRating() {
  if (nbLoaded === 0) {
    // Ensure grade is between 0 and 100
    grade = Math.max(0, Math.min(100, grade));
    animateRating(grade);
  }
}

/**
 * Try to load cached results from background service worker
 */
async function loadCachedResults() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = extractDomain(tab.url);
    
    if (!domain) return null;
    
    const key = `grade_${domain}`;
    const stored = await chrome.storage.local.get(key);
    
    if (stored[key]) {
      console.log('[Popup] Using cached data for:', domain, stored[key]);
      return stored[key];
    }
  } catch (error) {
    console.error('[Popup] Error loading cached results:', error);
  }
  
  return null;
}

/**
 * Apply cached results to the UI
 */
function applyCachedResults(cached) {
  // Apply ASCII check result
  if (cached.checks?.ascii) {
    const asciiResult = cached.checks.ascii;
    const asciiElement = document.getElementById("ascii-check-" + asciiResult.isAscii);
    if (asciiElement) {
      asciiElement.classList.remove("hidden");
    }
  }
  
  // Apply phishing result
  if (cached.checks?.phishing) {
    const phishingBadge = document.getElementById('phishing-badge');
    if (cached.checks.phishing.phishing && phishingBadge) {
      phishingBadge.classList.remove('hidden');
    }
  }
  
  // Apply WHOIS result
  if (cached.checks?.whois?.creation_date) {
    const dateElement = document.getElementById('domain-creation-date');
    if (dateElement) {
      let creationDate = cached.checks.whois.creation_date;
      if (typeof creationDate === 'object') {
        creationDate = creationDate[0];
      }
      const match = creationDate.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [_, y, m, d] = match;
        dateElement.innerText = `${d}-${m}-${y}`;
      }
    }
  }
  
  // Apply external domains count
  if (cached.checks?.externalDomains?.count !== undefined) {
    const externalDomainsCount = document.getElementById('external-domains-count');
    if (externalDomainsCount) {
      externalDomainsCount.textContent = cached.checks.externalDomains.count;
    }
  }
  
  // Animate the grade
  animateRating(cached.grade);
}

/**
 * Initialize popup - try cached data first, then run checks if no cache
 */
document.addEventListener('DOMContentLoaded', async () => {
  const cached = await cacheCheckPromise;
  
  if (cached) {
    applyCachedResults(cached);
  }
});

/**
 * 
 * Manage the domain display in the popup
 * 
 */
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const url = tabs[0].url;

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Update the domain display in the popup
    const domainElement = document.querySelector('.text-slate-900.dark\\:text-white.text-base.font-medium.leading-normal.flex-1.truncate');
    if (domainElement) {
      domainElement.textContent = domain;
    }

    // Update the favicon alt text and image source
    const faviconImg = document.querySelector('img[data-alt="Favicon for example.com"]');
    if (faviconImg) {
      faviconImg.setAttribute('data-alt', `Favicon for ${domain}`);
      if (tabs[0].favIconUrl) {
        faviconImg.src = tabs[0].favIconUrl;
      } else {
        faviconImg.src = '';
      }
    }
  });
});


/**
 * 
 * Manage the navigation
 * 
 */
document.addEventListener('DOMContentLoaded', () => {

  // Add event listener for the settings button
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', function() {
      console.log('Settings button clicked');
      window.location.href = 'settings.html';
    });
  }
})

/**
 *
 * Manage IDN homograph verification
 *
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for cache check and skip if cached data exists
  const cached = await cacheCheckPromise;
  if (cached) return;
  
  // Extract domain name
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const domain = extractDomain(tab.url);

  try {
    const result = await verifyDomain(domain)
    console.log(result)

    document.getElementById("ascii-check-" + result.isAscii).classList.remove("hidden");

    // If domain contains non-ASCII characters (potential IDN homograph attack)
    if (!result.isAscii) {
      grade -= 25;
    }
  } catch (error) {
    console.error('Error verifying ASCII domain:', error);
  }

  checkAndAnimateRating();
});


/**
 * Manage Country GEOIP
 */
document.addEventListener('DOMContentLoaded', async () => {
  const countryTextDiv = document.getElementById("geoip-country")
  countryTextDiv.innerText = 'Loading...'
  // Extract domain name
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const domain = extractDomain(tab.url);
  // Update name
  const result = await getCountryByDomain(domain)
  console.log(result)
  const countryFlagImg = document.getElementById("geoip-country-flag")
  const countryFlagLoader = document.getElementById("geoip-country-flag-loader")

  if (result.country_name) {
    countryTextDiv.innerText = result.country_name

    // Update flag
    countryFlagImg.src = `http://flags.fmcdn.net/data/flags/normal/${result.country_iso_code.toLowerCase()}.png`
    
    countryFlagImg.onload = () => {
      countryFlagLoader.classList.add("hidden")
      countryFlagImg.classList.remove("hidden")
    }
    
    countryFlagImg.onerror = () => {
      countryFlagLoader.classList.add("hidden")
    }
  } else {
    countryTextDiv.innerText = "Inconnu"
    countryFlagLoader.classList.add("hidden")
  }

})

/**
 * Manage phishing detection
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for cache check and skip if cached data exists
  const cached = await cacheCheckPromise;
  if (cached) return;
  
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const domain = extractDomain(tab.url);

  const phishingBadge = document.getElementById('phishing-badge');

  try {
    const result = await phishing.checkDomain(domain);
    console.log('Phishing check result:', result);

    if (result.phishing) {
      phishingBadge.classList.remove('hidden');
      grade -= 70; // Penalize heavily for phishing
    }
  } catch (error) {
    console.error('Error checking phishing:', error);
  }

  checkAndAnimateRating();
});

/**
 * Manage whois
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for cache check and skip if cached data exists
  const cached = await cacheCheckPromise;
  if (cached) return;
  
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  const domain = extractDomain(tab.url);

  const dateElement = document.getElementById('domain-creation-date')

  try {
    const result = await whois.lookup(domain);
    console.log(result)
    if (typeof result.creation_date === 'object') {
      result.creation_date = result.creation_date[0];
    }
    const [_, y, m, d] = result.creation_date.match(/(\d{4})-(\d{2})-(\d{2})/);
    const out = `${d}-${m}-${y}`;
    dateElement.innerText = out

    // Calcul du score à enlever
    const creationDate = new Date(`${y}-${m}-${d}T00:00:00Z`);
    const now = new Date();

    const diffTime = now - creationDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const score = Math.max(0, 30 - diffDays);
    grade -= score;

  } catch {
    console.error('Error looking up WHOIS for domain:', domain);
  }

  checkAndAnimateRating();
})


/**
 * Manage external domains count and navigation
 */
document.addEventListener('DOMContentLoaded', async () => {
  const externalDomainsCount = document.getElementById('external-domains-count');
  const externalDomainsCard = document.getElementById('external-domains-card');

  // Navigate to domains page on click
  externalDomainsCard.addEventListener('click', () => {
    window.location.href = 'domains.html';
  });

  // Wait for cache check and skip calculation if cached data exists
  const cached = await cacheCheckPromise;
  if (cached) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject script to count domains in the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
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
      const count = results[0].result;
      externalDomainsCount.textContent = count;

      // Penalize based on number of external domains
      // More external domains = lower trust score
      if (count >= 50) {
        grade -= 45;
      } else if (count >= 30) {
        grade -= 35;
      } else if (count >= 10) {
        grade -= 25;
      } else if (count >= 5) {
        grade -= 15;
      }
    }
  } catch (error) {
    console.error('Error counting external domains:', error);
    externalDomainsCount.textContent = '?';
  }

  checkAndAnimateRating();
});


/**
 *
 * Manage mail tracking
 *
 */


let localItems = null;

const loadSettings = async () => {
  // Default settings
  const defaultSettings = {
    aliasFormat: 'nomdusite',
    userEmail: '',
  };

  // Check if chrome.storage is available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(defaultSettings, function(items) {
      localItems = items;
      applySettings(items);
    });
  } else {
    // If chrome.storage is not available, use default settings
    localItems = defaultSettings;
  }
}

const getCurrentTaggedEmail = async (items) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const domain = extractDomain(tab.url);
  const baseDomain = getBaseDomain(domain);
  let tag = baseDomain.split('.')[0];

  if (items.aliasFormat === 'nomplusdate') {
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    tag += date;
  }
    
  const currentTaggedEmail = addTagToEmail(items.userEmail, tag);
  return currentTaggedEmail;
}


const applySettings = async (items) => {
  const mailSelector = document.getElementById('mail-selector');
  if (mailSelector) {

    const currentTaggedEmail = await getCurrentTaggedEmail(items)

    mailSelector.value = currentTaggedEmail;
    // Add options to mail selector
    const options = document.createElement('option');
    options.value = currentTaggedEmail;
    options.text = currentTaggedEmail;
    mailSelector.appendChild(options);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings()
  const copyButton = document.getElementById('copy-button');
  const autofillButton = document.getElementById('autofill-button');
  const mailSelector = document.getElementById('mail-selector');


  if (copyButton) {
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(mailSelector.value);
    });
  }

  if (autofillButton) {
    autofillButton.addEventListener('click', () => {
      autoCompleteEmail(mailSelector.value);
    });
  }
})

function animateRating(value, duration = 800) {
  const circle = document.getElementById("progressCircle");
  const r = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * r;

  const { grade, text } = getRatingData(value);

  // Mettre à jour le texte
  document.getElementById("ratingLetter").textContent = grade;
  document.getElementById("ratingText").textContent = text;

  document.getElementById("ratingSkeleton").classList.add("hidden");
  document.getElementById("ratingContent").classList.remove("hidden");

  // Couleur selon la valeur
  if (value >= 80) circle.setAttribute("stroke", "rgb(11,218,94)");
  else if (value >= 50) circle.setAttribute("stroke", "#f5c518");
  else circle.setAttribute("stroke", "#ef4444");

  circle.style.strokeDasharray = circumference;

  const targetOffset = circumference - (value / 100) * circumference;

  let start = null;

  function animate(ts) {
    if (start === null) start = ts;

    const progress = Math.min((ts - start) / duration, 1);
    const currentOffset = circumference * (1 - (value / 100) * progress);

    circle.style.strokeDashoffset = currentOffset;

    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}


function getRatingData(value) {
  if (value >= 90) return { grade: "A+", text: "Très bien" };
  if (value >= 80) return { grade: "A", text: "Bien" };
  if (value >= 70) return { grade: "B", text: "Correct" };
  if (value >= 60) return { grade: "C", text: "Moyen" };
  if (value >= 50) return { grade: "D", text: "Faible" };
  if (value >= 40) return { grade: "E", text: "Très faible" };
  return { grade: "F", text: "Correct" };
}
console.log()
