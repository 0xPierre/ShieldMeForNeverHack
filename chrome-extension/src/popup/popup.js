document.addEventListener('DOMContentLoaded', function() {
  // Get the current active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    // Get the current tab URL
    const url = tabs[0].url;

    // Create a URL object to extract the hostname
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
      // Update the favicon image source to use the current domain's favicon
      faviconImg.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }
  });

  // Add event listener for the settings button
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', function() {
      console.log('Settings button clicked');
      // Navigate to settings page
      window.location.href = 'settings.html';
    });
  }

});

