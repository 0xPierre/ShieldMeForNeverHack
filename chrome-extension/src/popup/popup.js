import { getCountry, getCountryByDomain } from "../services/geoip.js";
import { whois } from "../services/index.js";
import { extractDomain, getBaseDomain } from "../services/domain.js";
import { addTagToEmail, autoCompleteEmail } from "../services/mail.js";

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
  if (result.country_name) {
    countryTextDiv.innerText = result.country_name

    // Update flag
    const countryFlagImg = document.getElementById("geoip-country-flag")
    const countryFlagSvg = document.getElementById("geoip-country-flag-svg") 
    countryFlagImg.src = `http://flags.fmcdn.net/data/flags/normal/${result.country_iso_code.toLowerCase()}.png`
    
    countryFlagSvg.classList.add("hidden")
    countryFlagImg.classList.remove("hidden")
  } else {
    countryTextDiv.innerText = "Inconnu"
  }

})

/**
 * Manage whois
 */
document.addEventListener('DOMContentLoaded', async () => {
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
  } catch {
    console.error('Error looking up WHOIS for domain:', domain);
  }
})


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
  const tag = baseDomain.split('.')[0];
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