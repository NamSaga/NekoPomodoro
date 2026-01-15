//for notifications to work in Manifest V3
chrome.runtime.onInstalled.addListener(() => {
	console.log('Extension Installed');
}

// Handle notifications permission
chrome.notifications.onClicked.addListener((notificationId, buttonIndex) => {
	console.log('Notification clicked: ', notificationId, buttonIndex);
