/**
 * Domains page - displays list of external domains
 */

document.addEventListener('DOMContentLoaded', () => {
  // Handle back button click
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = 'popup.html';
    });
  }

  // Load and display domains
  loadDomains();
});

async function loadDomains() {
  const domainsCount = document.getElementById('domains-count');
  const domainsSkeleton = document.getElementById('domains-skeleton');
  const domainsList = document.getElementById('domains-list');
  const domainsEmpty = document.getElementById('domains-empty');
  const domainsError = document.getElementById('domains-error');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject script to count domains in the active tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Domain counting logic (inline since we can't use imports in injected scripts)
        const RESOURCE_SELECTORS = {
          scripts: 'script[src]',
          images: 'img[src]',
          stylesheets: 'link[rel="stylesheet"][href]',
          links: 'a[href]',
          iframes: 'iframe[src]',
          videos: 'video[src], video source[src]',
          audio: 'audio[src], audio source[src]',
          objects: 'object[data]',
          embeds: 'embed[src]',
          forms: 'form[action]',
          preload: 'link[rel="preload"][href], link[rel="prefetch"][href]',
        };

        function extractDomain(url) {
          try {
            const { hostname } = new URL(url);
            return hostname;
          } catch {
            return null;
          }
        }

        function getUrlFromElement(element) {
          if (element.src) return element.src;
          if (element.href) return element.href;
          if (element.data) return element.data;
          if (element.action) return element.action;
          return null;
        }

        const domainCounts = new Map();
        const currentDomain = extractDomain(document.location.href);

        for (const [type, selector] of Object.entries(RESOURCE_SELECTORS)) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            const url = getUrlFromElement(element);
            if (!url) continue;
            const domain = extractDomain(url);
            if (domain && domain !== currentDomain && !domain.endsWith(`.${currentDomain}`)) {
              if (!domainCounts.has(domain)) {
                domainCounts.set(domain, { count: 0, types: new Set() });
              }
              const entry = domainCounts.get(domain);
              entry.count++;
              entry.types.add(type);
            }
          }
        }

        // Convert to array and sort by count
        const domains = Array.from(domainCounts.entries())
          .map(([domain, data]) => ({
            domain,
            count: data.count,
            types: Array.from(data.types),
          }))
          .sort((a, b) => b.count - a.count);

        return {
          totalCount: domains.length,
          domains,
        };
      },
    });

    // Hide skeleton
    domainsSkeleton.classList.add('hidden');

    if (results && results[0] && results[0].result) {
      const { totalCount, domains } = results[0].result;
      domainsCount.textContent = totalCount;

      if (domains.length === 0) {
        domainsEmpty.classList.remove('hidden');
      } else {
        domainsList.classList.remove('hidden');
        domainsList.classList.add('flex');
        renderDomains(domains, domainsList);
      }
    } else {
      domainsError.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error counting external domains:', error);
    domainsSkeleton.classList.add('hidden');
    domainsError.classList.remove('hidden');
  }
}

function renderDomains(domains, container) {
  container.innerHTML = '';

  // Type icons mapping
  const typeLabels = {
    scripts: 'Script',
    images: 'Image',
    stylesheets: 'CSS',
    links: 'Lien',
    iframes: 'iFrame',
    videos: 'Vidéo',
    audio: 'Audio',
    objects: 'Objet',
    embeds: 'Embed',
    forms: 'Form',
    preload: 'Preload',
  };

  domains.forEach(({ domain, count, types }) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors';

    // Create type badges
    const typeBadges = types
      .slice(0, 3)
      .map(type => `<span class="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">${typeLabels[type] || type}</span>`)
      .join('');
    
    const moreTypes = types.length > 3 ? `<span class="text-[10px] text-slate-400">+${types.length - 3}</span>` : '';

    div.innerHTML = `
      <div class="flex items-center justify-center size-9 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 dark:text-slate-400"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
      </div>
      <div class="flex flex-col flex-grow min-w-0">
        <p class="text-sm font-medium text-slate-900 dark:text-white truncate">${domain}</p>
        <div class="flex items-center gap-1 mt-0.5 flex-wrap">
          ${typeBadges}
          ${moreTypes}
        </div>
      </div>
      <div class="flex items-center justify-center size-7 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0">
        <span class="text-xs font-medium text-slate-600 dark:text-slate-300">${count}</span>
      </div>
    `;

    container.appendChild(div);
  });
}

