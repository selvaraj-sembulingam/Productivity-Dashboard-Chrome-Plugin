# Productivity Dashboard
A simple and effective Chrome extension designed to help you track your website usage, understand your daily productivity, and visualize your weekly activity patterns.

## Features
* Real-Time Tracking: Monitors time spent on different websites.

* Productivity Score: Calculates a daily score based on time spent on productive vs. distracting sites.

* Configurable Sites: Allows you to customize which websites are considered "productive" and "distracting."

* Top Sites Today: Displays a list of the most-visited sites and the time spent on them.

* Weekly Heatmap: Visualizes your productive activity throughout the week, showing which hours you are most focused.

* History Import: Upon installation, the extension can import up to 7 days of your browsing history to give you an initial overview.

## How It Works
The extension operates in the background to track your active tab.

1. Tab Activation & Updates: When you switch to a new tab or a tab's URL changes, the extension records the time spent on the previous site.

2. Site Classification: It checks the hostname of the new URL against your custom lists of productive and distracting sites. Any site not on a list is considered neutral.

3. Data Storage: Usage data (hostname, start time, duration, and classification) is stored in your local browser storage.

4. Data Visualization: The popup.html and popup.js files process the stored data to render the dashboard, including the productivity score, time spent on different categories, and the weekly heatmap.

5. Settings: The options.html and options.js pages provide an interface to manage your productive and distracting site lists.

## File Structure
* `manifest.json`: The core file for the Chrome extension, defining its name, version, permissions, and other essential properties.

* `background.js`: The service worker that runs in the background. It handles the core logic for tracking browsing time, importing history, and managing state.

* `popup.html`: The user interface that appears when you click the extension's icon. It displays the dashboard.

* `popup.css`: Styles for the popup dashboard.

* `popup.js`: JavaScript for the popup, responsible for fetching data, calculating statistics, and rendering the dashboard UI.

* `options.html`: The settings page where users can manage their productive and distracting site lists.

* `options.css`: Styles for the options page.

* `options.js`: JavaScript for the options page, handling the saving and loading of site lists and data clearing.

## Permissions
The manifest.json file requests the following permissions to function correctly:

* `storage`: To save the user's site lists and browsing data.

* `tabs`: To monitor the active tab and its URL.

* `history`: To perform the one-time import of the user's past browsing history.

* `favicon`: To display favicons for the top sites in the dashboard.

* `idle`: To detect when the user is idle, ensuring tracking pauses.

## Installation and Usage
1. Clone or Download: Get the code from this repository.

2. Open Chrome Extensions: Navigate to `chrome://extensions` in your browser.

3. Enable Developer Mode: Toggle the "Developer mode" switch in the top-right corner.

4. Load Unpacked: Click the "Load unpacked" button.

5. Select Folder: Choose the folder containing the extension's files.

6. Pin the Extension: The "Productivity Dashboard" icon should now appear in your toolbar. Click the puzzle icon and pin the extension for easy access.

7. Click the Icon: Click the extension's icon to see your dashboard.

8. Customize Settings: Click the gear icon on the dashboard to open the settings page and customize your productive and distracting sites.