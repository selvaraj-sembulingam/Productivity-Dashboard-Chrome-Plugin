// Default lists - user can override in options
const defaultProductiveSites = ['github.com', 'stackoverflow.com', 'developer.mozilla.org', 'docs.google.com', 'udemy.com'];
const defaultDistractingSites = ['youtube.com', 'facebook.com', 'twitter.com', 'reddit.com', 'netflix.com'];

// 💡 NEW: This function runs once to import past history
async function importFromHistory() {
    console.log("Starting one-time history import...");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const historyItems = await chrome.history.search({
        text: '', // All sites
        startTime: sevenDaysAgo.getTime(),
        maxResults: 10000 // A large number to get comprehensive history
    });

    if (historyItems.length === 0) return;

    // Sort by visit time to calculate duration between visits
    historyItems.sort((a, b) => a.lastVisitTime - b.lastVisitTime);

    const importedData = [];
    const DURATION_CAP_SECONDS = 15 * 60; // Cap duration at 15 minutes

    for (let i = 0; i < historyItems.length - 1; i++) {
        const currentVisit = historyItems[i];
        const nextVisit = historyItems[i + 1];

        if (!currentVisit.url || !currentVisit.url.startsWith('http')) continue;

        let duration = (nextVisit.lastVisitTime - currentVisit.lastVisitTime) / 1000;
        
        // Apply the cap to avoid logging long idle times
        if (duration > DURATION_CAP_SECONDS) {
            duration = DURATION_CAP_SECONDS;
        }
        
        if (duration < 3) continue; // Ignore very short visits

        const hostname = new URL(currentVisit.url).hostname.replace('www.', '');
        const classification = await getSiteClassification(hostname);

        importedData.push({
            hostname: hostname,
            startTime: currentVisit.lastVisitTime,
            duration: Math.round(duration),
            classification: classification
        });
    }

    // Save the imported data to storage
    const { browsingData = [] } = await chrome.storage.local.get('browsingData');
    const mergedData = [...browsingData, ...importedData];
    await chrome.storage.local.set({ browsingData: mergedData });
    console.log(`History import complete. Added ${importedData.length} entries.`);
}


// --- Main Extension Logic ---

chrome.runtime.onInstalled.addListener((details) => {
  // Set default sites
  chrome.storage.local.get(['productiveSites', 'distractingSites'], (result) => {
    if (!result.productiveSites) {
      chrome.storage.local.set({ productiveSites: defaultProductiveSites });
    }
    if (!result.distractingSites) {
      chrome.storage.local.set({ distractingSites: defaultDistractingSites });
    }
  });
  chrome.storage.session.set({ activeInfo: {} });

  // 🚀 Run the history import ONLY on first install
  if (details.reason === 'install') {
    importFromHistory();
  }
});

async function getSiteClassification(hostname) {
  if (!hostname) return 'neutral';
  const data = await chrome.storage.local.get(['productiveSites', 'distractingSites']);
  if (data.productiveSites && data.productiveSites.some(site => hostname.includes(site))) {
    return 'productive';
  }
  if (data.distractingSites && data.distractingSites.some(site => hostname.includes(site))) {
    return 'distracting';
  }
  return 'neutral';
}

async function stopTracking() {
  const { activeInfo } = await chrome.storage.session.get('activeInfo');
  
  if (activeInfo && activeInfo.startTime && activeInfo.url) {
    const endTime = Date.now();
    const duration = Math.round((endTime - activeInfo.startTime) / 1000);
    
    if (duration > 2) {
      const hostname = new URL(activeInfo.url).hostname.replace('www.', '');
      const classification = await getSiteClassification(hostname);
      const entry = {
        hostname: hostname,
        startTime: activeInfo.startTime,
        duration: duration,
        classification: classification
      };
      const { browsingData = [] } = await chrome.storage.local.get('browsingData');
      browsingData.push(entry);
      await chrome.storage.local.set({ browsingData });
    }
  }
  await chrome.storage.session.set({ activeInfo: {} });
}

async function startTracking(tab) {
    if (!tab || !tab.id || !tab.url || !tab.url.startsWith('http')) {
        await stopTracking();
        return;
    }
    await stopTracking();
    await chrome.storage.session.set({
        activeInfo: { tabId: tab.id, url: tab.url, startTime: Date.now() }
    });
}

// --- Event Listeners for Real-Time Tracking ---
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId).catch(() => null);
  await startTracking(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url) {
        await startTracking(tab);
    }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await stopTracking();
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId: windowId }).catch(() => []);
    await startTracking(tab);
  }
});

chrome.idle.onStateChanged.addListener(async (newState) => {
    if (newState === "active") {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }).catch(() => []);
        await startTracking(tab);
    } else {
        await stopTracking();
    }
});