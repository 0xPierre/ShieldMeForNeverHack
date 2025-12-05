import { getCountry, getCountryByDomain } from "../services/geoip.js";
import { whois } from "../services/index.js";
import { extractDomain } from "../services/domain.js";

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
    const [_, y, m, d] = result.creation_date.match(/(\d{4})-(\d{2})-(\d{2})/);
    const out = `${d}-${m}-${y}`;
    dateElement.innerText = out
  } catch {
    console.error('Error looking up WHOIS for domain:', domain);
  }
})