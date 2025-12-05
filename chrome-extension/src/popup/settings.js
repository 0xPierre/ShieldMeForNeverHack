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
});

// Load settings from storage
function loadSettings() {
  // Default settings
  const defaultSettings = {
    aliasFormat: 'nomdusite',
    userEmail: '',
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

  // Set alias format
  const aliasFormat = document.getElementById('alias-format');
  if (aliasFormat) {
    for (let i = 0; i < aliasFormat.options.length; i++) {
      if (aliasFormat.options[i].value === items.aliasFormat) {
        aliasFormat.selectedIndex = i;
        break;
      }
    }
  }

  // Set user email
  const emailInput = document.getElementById('email');
  if (emailInput) {
    if (emailInput) {
      emailInput.value = items.userEmail;
    }
    else {
      emailInput.placeholder = "jean.dupond@mail.com";
    }
  }
}

// Save settings to storage
function saveSettings() {
  const aliasFormat = document.getElementById('alias-format');
  const emailInput = document.getElementById('email');

  // Create settings object
  const settings = {
    aliasFormat: aliasFormat ? aliasFormat.options[aliasFormat.selectedIndex].value : 'nomdusite',
    userEmail: emailInput ? emailInput.value : '',
  };

  if (settings.userEmail && !checkEmailFormat(settings.userEmail)) {
    showErrorNotification("Format d'email incorrect !")
    return;
  }

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

function checkEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

// Show a saved notification
function showErrorNotification(error) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg';
  notification.textContent = 'Erreur : ' + error;
  document.body.appendChild(notification);

  // Remove notification after 2 seconds
  setTimeout(() => {
    notification.remove();
  }, 2000);
}
