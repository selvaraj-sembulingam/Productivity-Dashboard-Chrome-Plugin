document.addEventListener('DOMContentLoaded', async () => {
    const { browsingData } = await chrome.storage.local.get('browsingData');
    if (!browsingData) {
        console.log("No browsing data found.");
        return;
    }

    // --- 1. Process Today's Data for Score, Stats, and Top Sites ---
    processDailyData(browsingData);
    
    // --- 2. Process Last 7 Days for Heatmap ---
    renderHeatmap(browsingData);

    // --- 3. Setup Options Button ---
    document.getElementById('options-btn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});

function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
}

function processDailyData(browsingData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysData = browsingData.filter(entry => entry.startTime >= today.getTime());

    let productiveTime = 0;
    let distractingTime = 0;
    const timeBySite = {};

    todaysData.forEach(entry => {
        if (entry.classification === 'productive') {
            productiveTime += entry.duration;
        } else if (entry.classification === 'distracting') {
            distractingTime += entry.duration;
        }
        timeBySite[entry.hostname] = (timeBySite[entry.hostname] || 0) + entry.duration;
    });

    // --- Render Score ---
    const totalTrackedTime = productiveTime + distractingTime;
    let score = "0";
    if (totalTrackedTime > 0) {
        score = ((productiveTime / totalTrackedTime) * 10).toFixed(1);
    }
    document.getElementById('score').textContent = `${score} / 10`;

    // --- Render Stats ---
    document.getElementById('productive-time').textContent = formatTime(productiveTime);
    document.getElementById('distracting-time').textContent = formatTime(distractingTime);

    // --- Render Top Sites ---
    const topSitesList = document.getElementById('top-sites-list');
    topSitesList.innerHTML = '';
    const sortedSites = Object.entries(timeBySite).sort((a, b) => b[1] - a[1]);
    
    if (sortedSites.length === 0) {
        topSitesList.innerHTML = '<li class="loading">No activity tracked yet today.</li>';
        return;
    }

    sortedSites.slice(0, 5).forEach(([hostname, time]) => {
        const li = document.createElement('li');
        li.className = 'site-entry';
        
        const faviconUrl = `chrome://favicon/size/16/https://www.${hostname}`;

        li.innerHTML = `
            <span class="site-name">${hostname}</span>
            <span class="site-time">${formatTime(time)}</span>
        `;
        topSitesList.appendChild(li);
    });
}


function renderHeatmap(browsingData) {
    const container = document.getElementById('heatmap-container');
    container.innerHTML = '';

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    container.appendChild(document.createElement('div')); // Top-left empty cell
    for (let i = 0; i < 24; i++) {
        const hourLabel = document.createElement('div');
        hourLabel.className = 'hour-label';
        hourLabel.textContent = (i % 3 === 0) ? i : '';
        container.appendChild(hourLabel);
    }
    
    const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    browsingData.forEach(entry => {
        if (entry.classification === 'productive' && entry.startTime >= sevenDaysAgo.getTime()) {
            const date = new Date(entry.startTime);
            heatmapData[date.getDay()][date.getHours()] += entry.duration;
        }
    });

    let maxDuration = Math.max(...heatmapData.flat());

    for (let day = 0; day < 7; day++) {
        const dayLabel = document.createElement('div');
        dayLabel.className = 'day-label';
        dayLabel.textContent = days[day];
        container.appendChild(dayLabel);

        for (let hour = 0; hour < 24; hour++) {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            const duration = heatmapData[day][hour];
            let level = 0;
            if (maxDuration > 0) {
                const ratio = duration / maxDuration;
                if (ratio > 0.75) level = 4;
                else if (ratio > 0.5) level = 3;
                else if (ratio > 0.25) level = 2;
                else if (ratio > 0) level = 1;
            }
            cell.dataset.level = level;
            cell.title = `${days[day]}, ${hour}:00 - ${formatTime(duration)} productive`;
            container.appendChild(cell);
        }
    }
}