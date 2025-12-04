/**
 * Domain detection service
 */

export default function getDomainName() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject("Aucun " +
            "onglet actif trouvé");
        return;
      }
      try {
        const url = new URL(tabs[0].url);
        const domain = url.hostname.replace("www.", "");
        const tag = domain.split(".")[0];
        resolve(tag);
      } catch (e) {
        reject(e);
      }
    });
  });
}

