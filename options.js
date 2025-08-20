const productiveSitesEl = document.getElementById('productiveSites');
const distractingSitesEl = document.getElementById('distractingSites');
const saveBtn = document.getElementById('save');
const clearBtn = document.getElementById('clearData');
const statusEl = document.getElementById('status');

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['productiveSites', 'distractingSites'], (result) => {
    if (result.productiveSites) {
      productiveSitesEl.value = result.productiveSites.join('\n');
    }
    if (result.distractingSites) {
      distractingSitesEl.value = result.distractingSites.join('\n');
    }
  });
});

saveBtn.addEventListener('click', () => {
  const productiveSites = productiveSitesEl.value.split('\n').filter(s => s.trim() !== '');
  const distractingSites = distractingSitesEl.value.split('\n').filter(s => s.trim() !== '');

  chrome.storage.local.set({ productiveSites, distractingSites }, () => {
    statusEl.textContent = 'Settings saved!';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  });
});

clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all your tracked browsing data? This cannot be undone.')) {
        chrome.storage.local.set({ browsingData: [] }, () => {
            statusEl.textContent = 'All browsing data has been cleared.';
            setTimeout(() => { statusEl.textContent = ''; }, 3000);
        });
    }
});