/**
 * Domain detection service
 */

// export function extractDomain(url) {
//   try {
//     const { hostname } = new URL(url);
//     return hostname;
//   } catch {
//     return null;
//   }
// }
//
// export function getBaseDomain(hostname) {
//   const parts = hostname.split('.');
//   if (parts.length <= 2) return hostname;
//   return parts.slice(-2).join('.');
// }

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

