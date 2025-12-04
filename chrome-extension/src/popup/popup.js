document.addEventListener('DOMContentLoaded', function() {
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

