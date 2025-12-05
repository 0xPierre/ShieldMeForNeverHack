import { getCountry, getCountryByDomain } from "../services/geoip.js";
import { whois } from "../services/index.js";
import { extractDomain, getBaseDomain } from "../services/domain.js";
import { addTagToEmail, autoCompleteEmail } from "../services/mail.js";

let nbLoaded, grade;

document.addEventListener('DOMContentLoaded', () => {
  nbLoaded = 0;
  grade = 50;
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

    // Calcul du score à enlever
    const creationDate = new Date(`${y}-${m}-${d}T00:00:00Z`);
    const now = new Date();

    const diffTime = now - creationDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const score = Math.max(0, 30 - diffDays);
    grade -= score;
    nbLoaded++;

    animateRating(grade)

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
  if (value >= 90) return { grade: "A+", text: "Excellent" };
  if (value >= 80) return { grade: "A", text: "Très bien" };
  if (value >= 70) return { grade: "B", text: "Bien" };
  if (value >= 60) return { grade: "C", text: "Correct" };
  if (value >= 50) return { grade: "D", text: "Moyen" };
  if (value >= 40) return { grade: "E", text: "Faible" };
  return { grade: "F", text: "Insuffisant" };
}
