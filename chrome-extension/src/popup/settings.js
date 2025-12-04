document.addEventListener('DOMContentLoaded', function() {
  // Handle back button click
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', function() {
      // Navigate back to popup.html
      window.location.href = 'popup.html';
    });
  }

  // Load saved settings
  loadSettings();

  // Handle save button click
  const saveButton = document.getElementById('save-button');
  if (saveButton) {
    saveButton.addEventListener('click', function() {
      saveSettings();
    });
  }

  // Handle Mail+ toggle switch
  const activateFeature = document.getElementById('activate-feature');
  if (activateFeature) {
    activateFeature.addEventListener('change', function() {
      // Update the toggle switch appearance
      const toggleLabel = activateFeature.parentElement;
      if (activateFeature.checked) {
        toggleLabel.classList.add('justify-end', 'bg-primary');
      } else {
        toggleLabel.classList.remove('justify-end', 'bg-primary');
      }
    });
  }

  // Handle theme toggle switch
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('change', function() {
      // Update the toggle switch appearance
      const toggleLabel = themeToggle.parentElement;
      if (themeToggle.checked) {
        toggleLabel.classList.add('justify-end', 'bg-primary');
        document.documentElement.classList.add('dark');
      } else {
        toggleLabel.classList.remove('justify-end', 'bg-primary');
        document.documentElement.classList.remove('dark');
      }

      // Save theme preference immediately
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set({
          darkMode: themeToggle.checked
        });
      }
    });
  }

  // Handle domain input
  const domainInput = document.getElementById('domain-input');
  if (domainInput) {
    domainInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        addExcludedDomain(domainInput.value);
        domainInput.value = '';
      }
    });
  }

  // Set up delete buttons for excluded domains
  setupDeleteButtons();
});

// Load settings from storage
function loadSettings() {
  // Default settings
  const defaultSettings = {
    mailPlusEnabled: true,
    aliasFormat: '+nomdusite (ex: +amazon)',
    askBeforeFilling: false,
    excludedDomains: ['paypal.com', 'bankofamerica.com'],
    userEmail: 'votre.email@provider.com',
    darkMode: true // Default to dark mode
  };

  // Check if chrome.storage is available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get(defaultSettings, function(items) {
      applySettings(items);
    });
  } else {
    // If chrome.storage is not available, use default settings
    applySettings(defaultSettings);
  }
}

// Apply settings to the UI
function applySettings(items) {
  // Set toggle switch
  const activateFeature = document.getElementById('activate-feature');
  if (activateFeature) {
    activateFeature.checked = items.mailPlusEnabled;
    // Update toggle appearance
    const toggleLabel = activateFeature.parentElement;
    if (items.mailPlusEnabled) {
      toggleLabel.classList.add('justify-end', 'bg-primary');
    } else {
      toggleLabel.classList.remove('justify-end', 'bg-primary');
    }
  }

  // Set theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.checked = items.darkMode;
    // Update toggle appearance
    const toggleLabel = themeToggle.parentElement;
    if (items.darkMode) {
      toggleLabel.classList.add('justify-end', 'bg-primary');
      document.documentElement.classList.add('dark');
    } else {
      toggleLabel.classList.remove('justify-end', 'bg-primary');
      document.documentElement.classList.remove('dark');
    }
  }

  // Set alias format
  const aliasFormat = document.getElementById('alias-format');
  if (aliasFormat) {
    for (let i = 0; i < aliasFormat.options.length; i++) {
      if (aliasFormat.options[i].text === items.aliasFormat) {
        aliasFormat.selectedIndex = i;
        break;
      }
    }
  }

  // Set ask before filling checkbox
  const askBeforeFilling = document.getElementById('ask-before-filling');
  if (askBeforeFilling) {
    askBeforeFilling.checked = items.askBeforeFilling;
  }

  // Set user email
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.value = items.userEmail;
  }

  // Display excluded domains
  displayExcludedDomains(items.excludedDomains);
}

// Save settings to storage
function saveSettings() {
  const activateFeature = document.getElementById('activate-feature');
  const aliasFormat = document.getElementById('alias-format');
  const askBeforeFilling = document.getElementById('ask-before-filling');
  const emailInput = document.getElementById('email');

  // Get all excluded domains from the UI
  const excludedDomainsElements = document.querySelectorAll('#excluded-domains > div');
  const excludedDomains = Array.from(excludedDomainsElements).map(element => {
    return element.querySelector('span').textContent;
  });

  // Get theme toggle state
  const themeToggle = document.getElementById('theme-toggle');

  // Create settings object
  const settings = {
    mailPlusEnabled: activateFeature ? activateFeature.checked : true,
    aliasFormat: aliasFormat ? aliasFormat.options[aliasFormat.selectedIndex].text : '+nomdusite (ex: +amazon)',
    askBeforeFilling: askBeforeFilling ? askBeforeFilling.checked : false,
    excludedDomains: excludedDomains,
    userEmail: emailInput ? emailInput.value : 'votre.email@provider.com',
    darkMode: themeToggle ? themeToggle.checked : true
  };

  // Check if chrome.storage is available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    // Save to Chrome storage
    chrome.storage.sync.set(settings, function() {
      // Show a saved notification
      showSavedNotification();
    });
  } else {
    // If chrome.storage is not available, just show the notification
    showSavedNotification();
  }
}

// Display excluded domains in the UI
function displayExcludedDomains(domains) {
  const excludedDomainsContainer = document.getElementById('excluded-domains');
  if (!excludedDomainsContainer) return;

  // Clear existing domains
  excludedDomainsContainer.innerHTML = '';

  // Add each domain to the UI
  domains.forEach(domain => {
    const domainElement = document.createElement('div');
    domainElement.className = 'flex items-center justify-between rounded-md bg-slate-100 dark:bg-slate-800 p-3';
    domainElement.innerHTML = `
      <span class="text-slate-700 dark:text-slate-300">${domain}</span>
      <button class="text-red-500 hover:text-red-700 dark:hover:text-red-400" data-domain="${domain}">
        <span class="material-symbols-outlined">delete</span>
      </button>
    `;
    excludedDomainsContainer.appendChild(domainElement);
  });

  // Set up delete buttons
  setupDeleteButtons();
}

// Add a new excluded domain
function addExcludedDomain(domain) {
  if (!domain) return;

  // Basic validation
  domain = domain.trim().toLowerCase();
  if (!domain.match(/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/)) {
    alert('Veuillez entrer un nom de domaine valide (ex: example.com)');
    return;
  }

  // Check if domain already exists
  const excludedDomainsContainer = document.getElementById('excluded-domains');
  const existingDomains = Array.from(excludedDomainsContainer.querySelectorAll('span')).map(span => span.textContent);

  if (existingDomains.includes(domain)) {
    alert('Ce domaine est déjà dans la liste des exclusions');
    return;
  }

  // Add the new domain to the UI
  const domainElement = document.createElement('div');
  domainElement.className = 'flex items-center justify-between rounded-md bg-slate-100 dark:bg-slate-800 p-3';
  domainElement.innerHTML = `
    <span class="text-slate-700 dark:text-slate-300">${domain}</span>
    <button class="text-red-500 hover:text-red-700 dark:hover:text-red-400" data-domain="${domain}">
      <span class="material-symbols-outlined">delete</span>
    </button>
  `;
  excludedDomainsContainer.appendChild(domainElement);

  // Set up delete button for the new domain
  setupDeleteButtons();
}

// Set up delete buttons for excluded domains
function setupDeleteButtons() {
  const deleteButtons = document.querySelectorAll('#excluded-domains button[data-domain]');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const domain = this.getAttribute('data-domain');
      const domainElement = this.closest('div');
      domainElement.remove();
    });
  });
}

// Show a saved notification
function showSavedNotification() {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg';
  notification.textContent = 'Paramètres enregistrés';
  document.body.appendChild(notification);

  // Remove notification after 2 seconds
  setTimeout(() => {
    notification.remove();
  }, 2000);
}
