/**
 * Popup script for NeerHackPrivacy extension
 */

import { getCountry } from '../services/geoip.js';
import { verifyDomain } from '../services/ascii.js';
import { extractDomain } from '../services/domain.js';
import { lookup as whoisLookup } from '../services/whois.js';
import addTagToEmail from '../services/mail.js';
import { getBaseDomain } from '../services/domain.js';

// Store the generated tagged email
let currentTaggedEmail = null;

document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the popup
 */
function init() {
  setupEventListeners();
  checkCurrentDomain();
  initEmailSection();
}

/**
 * Initialize the email section
 */
function initEmailSection() {
  const emailResultDiv = document.getElementById('emailResult');
  if (emailResultDiv) {
    emailResultDiv.textContent = 'Enter your email and click "Add Tag"';
    emailResultDiv.className = 'result';
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  const changeColorBtn = document.getElementById('changeColorBtn');
  const addTagBtn = document.getElementById('addTagBtn');
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const fillEmailBtn = document.getElementById('fillEmailBtn');
  
  if (changeColorBtn) {
    changeColorBtn.addEventListener('click', handleColorChange);
  }
  
  if (addTagBtn) {
    addTagBtn.addEventListener('click', handleAddTag);
  }
  
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', handleCopyEmail);
  }
  
  if (fillEmailBtn) {
    fillEmailBtn.addEventListener('click', handleFillEmail);
  }
}

/**
 * Get the current tab's URL and check its domain
 */
async function checkCurrentDomain() {
  const currentDomainDiv = document.getElementById('currentDomain');
  const resultDiv = document.getElementById('asciiResult');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab?.url) {
      currentDomainDiv.textContent = 'No URL available';
      showResult(resultDiv, 'error', 'Unable to get current tab URL');
      return;
    }

    const domain = extractDomain(tab.url);
    
    if (!domain) {
      currentDomainDiv.textContent = tab.url;
      showResult(resultDiv, 'error', 'Invalid URL format');
      return;
    }

    currentDomainDiv.textContent = domain;
    checkDomainAscii(domain);
    checkWhois(domain);
  } catch (error) {
    currentDomainDiv.textContent = 'Error';
    showResult(resultDiv, 'error', `Error: ${error.message}`);
  }
}

/**
 * Check if domain contains only ASCII characters
 */
function checkDomainAscii(domain) {
  const resultDiv = document.getElementById('asciiResult');
  const result = verifyDomain(domain);

  if (result.error) {
    showResult(resultDiv, 'error', result.error);
  } else if (result.isAscii) {
    showResult(resultDiv, 'safe', '✓ Domain is safe (ASCII only)');
  } else {
    const chars = result.nonAsciiChars
      .map(c => `"${c.char}" (${c.unicode}) at position ${c.position}`)
      .join(', ');
    showResult(
      resultDiv,
      'warning',
      '⚠ Potential homograph attack detected!',
      `Non-ASCII characters: ${chars}`
    );
  }
}

/**
 * Check WHOIS info for the domain
 */
async function checkWhois(domain) {
  const whoisResultDiv = document.getElementById('whoisResult');
  
  try {
    const data = await whoisLookup(domain);
    
    if (data.creation_date) {
      const creationDate = Array.isArray(data.creation_date) 
        ? data.creation_date[0] 
        : data.creation_date;
      const date = new Date(creationDate);
      const formattedDate = date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      showResult(whoisResultDiv, 'safe', `Domain created: ${formattedDate}`);
    } else {
      showResult(whoisResultDiv, 'warning', 'Creation date not available');
    }
  } catch (error) {
    showResult(whoisResultDiv, 'error', `WHOIS error: ${error.message}`);
  }
}

/**
 * Display result in the result div
 */
function showResult(resultDiv, type, message, details = null) {
  resultDiv.className = `result ${type}`;
  resultDiv.innerHTML = `
    <div class="label">${message}</div>
    ${details ? `<div class="details">${details}</div>` : ''}
  `;
}

/**
 * Handle color change button click
 */
async function handleColorChange() {
  const changeColorBtn = document.getElementById('changeColorBtn');
  const ip = await getCountry('82.66.127.20');
  console.log(ip);
  const randomColor = generateRandomColor();
  document.body.style.backgroundColor = randomColor;
  changeColorBtn.innerText = ip.country_name;
}

/**
 * Generate a random hex color
 * @returns {string} Random hex color
 */
function generateRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Handle adding a tag to the email
 */
async function handleAddTag() {
  const emailInput = document.getElementById('emailInput');
  const emailResultDiv = document.getElementById('emailResult');
  const emailDetailsDiv = document.getElementById('emailDetails');
  const email = emailInput.value.trim();
  
  if (!email) {
    showResult(emailResultDiv, 'error', 'Please enter an email address');
    emailDetailsDiv.classList.add('hidden');
    return;
  }
  
  try {
    // Get current domain for the tag
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = extractDomain(tab.url);
    const baseDomain = getBaseDomain(domain);
    const tag = baseDomain.split('.')[0];
    
    currentTaggedEmail = addTagToEmail(email, tag);
    showResult(emailResultDiv, 'safe', `Tagged email: ${currentTaggedEmail}`);
    emailDetailsDiv.classList.remove('hidden');
  } catch (error) {
    showResult(emailResultDiv, 'error', error.message);
    emailDetailsDiv.classList.add('hidden');
    currentTaggedEmail = null;
  }
}

/**
 * Handle copying the tagged email to clipboard
 */
async function handleCopyEmail() {
  const emailResultDiv = document.getElementById('emailResult');
  
  if (!currentTaggedEmail) {
    showResult(emailResultDiv, 'error', 'No tagged email to copy');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(currentTaggedEmail);
    showResult(emailResultDiv, 'safe', `Copied: ${currentTaggedEmail}`);
  } catch (error) {
    showResult(emailResultDiv, 'error', 'Failed to copy to clipboard');
  }
}

/**
 * Handle filling the tagged email into the active page
 */
async function handleFillEmail() {
  const emailResultDiv = document.getElementById('emailResult');
  
  if (!currentTaggedEmail) {
    showResult(emailResultDiv, 'error', 'No tagged email to fill');
    return;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (email) => {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          activeElement.value = email;
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          // Try to find an email input field
          const emailInput = document.querySelector('input[type="email"]') || 
                             document.querySelector('input[name*="email"]') ||
                             document.querySelector('input[placeholder*="email"]');
          if (emailInput) {
            emailInput.value = email;
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      },
      args: [currentTaggedEmail]
    });
    
    showResult(emailResultDiv, 'safe', `Filled: ${currentTaggedEmail}`);
  } catch (error) {
    showResult(emailResultDiv, 'error', `Failed to fill: ${error.message}`);
  }
}



