// Apply theme based on saved preference
function applyTheme() {
  // Check if chrome.storage is available
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    chrome.storage.sync.get({
      darkMode: true // Default to dark mode
    }, function(items) {
      if (items.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  } else {
    // Default to dark mode if chrome.storage is not available
    document.documentElement.classList.add('dark');
  }
}

// Wait for DOM to be fully loaded before applying theme
document.addEventListener('DOMContentLoaded', function() {
  applyTheme();
});
