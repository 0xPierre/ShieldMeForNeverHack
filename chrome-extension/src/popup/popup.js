/**
 * Popup script for NeerHackPrivacy extension
 */

import { getCountry } from '../services/geoip.js';
import { verifyDomain } from '../services/ascii.js';
import { extractDomain } from '../services/domain.js';

document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the popup
 */
function init() {
  setupEventListeners();
  checkCurrentDomain();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  const changeColorBtn = document.getElementById('changeColorBtn');
  
  if (changeColorBtn) {
    changeColorBtn.addEventListener('click', handleColorChange);
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
