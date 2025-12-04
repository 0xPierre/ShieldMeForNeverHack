/**
 * Popup script for NeerHackPrivacy extension
 */

import { getCountry } from '../services/geoip.js';

document.addEventListener('DOMContentLoaded', init);

/**
 * Initialize the popup
 */
function init() {
  setupEventListeners();
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
 * Handle color change button click
 */
async function handleColorChange() {
  const changeColorBtn = document.getElementById('changeColorBtn');
const ip = await getCountry('82.66.127.20');
console.log(ip);
  const randomColor = generateRandomColor();
  document.body.style.backgroundColor = randomColor;
  changeColorBtn.innerText = ip.country_name
}

/**
 * Generate a random hex color
 * @returns {string} Random hex color
 */
function generateRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}
