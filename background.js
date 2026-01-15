// Timer state
let timerState = {
	secondsLeft: 25 * 60,
	isRunning: false,
	isWorkMode: true,
	pomodoroCount: 0,
	workDuration: 25,
	breakDuration: 5,
	endTime: null
};

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
	console.log('Extension Installed');
	chrome.storage.sync.get(['pomodoroCount', 'workDuration', 'breakDuration'], (data) => {
		timerState.pomodoroCount = data.pomodoroCount || 0;
		timerState.workDuration = data.workDuration || 25;
		timerState.breakDuration = data.breakDuration || 5;
		timerState.secondsLeft = timerState.workDuration * 60;
	});
});

// Load state on startup
chrome.runtime.onStartup.addListener(() => {
	chrome.storage.local.get(['timerState'], (data) => {
		if (data.timerState) {
			timerState = data.timerState;
			if (timerState.isRunning && timerState.endTime) {
				// Calculate remaining time
				const now = Date.now();
				const remaining = Math.round((timerState.endTime - now) / 1000);
				if (remaining > 0) {
					timerState.secondsLeft = remaining;
					startAlarm();
				} else {
					completePhase();
				}
			}
		}
	});
});

// Handle alarm (fires every second while timer is running)
chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name === 'pomodoroTick') {
		const now = Date.now();
		const remaining = Math.round((timerState.endTime - now) / 1000);
		
		if (remaining <= 0) {
			completePhase();
		} else {
			timerState.secondsLeft = remaining;
			saveState();
		}
	}
});

// Start the alarm
function startAlarm() {
	timerState.isRunning = true;
	timerState.endTime = Date.now() + (timerState.secondsLeft * 1000);
	chrome.alarms.create('pomodoroTick', { periodInMinutes: 1/60 }); // Every second
	saveState();
}

// Stop the alarm
function stopAlarm() {
	timerState.isRunning = false;
	timerState.endTime = null;
	chrome.alarms.clear('pomodoroTick');
	saveState();
}

// Complete the current phase
function completePhase() {
	stopAlarm();
	
	if (timerState.isWorkMode) {
		// Work phase complete
		timerState.pomodoroCount++;
		chrome.storage.sync.set({ pomodoroCount: timerState.pomodoroCount });
		
		// Show notification
		chrome.notifications.create('pomodoroComplete', {
			type: 'basic',
			iconUrl: 'icons/icon.png',
			title: 'Pomodoro Complete!',
			message: 'Time for a break!',
			priority: 2
		});
		
		// Switch to break mode
		timerState.isWorkMode = false;
		timerState.secondsLeft = timerState.breakDuration * 60;
	} else {
		// Break phase complete
		chrome.notifications.create('breakComplete', {
			type: 'basic',
			iconUrl: 'icons/icon.png',
			title: 'Break Over!',
			message: 'Time to get back to work!',
			priority: 2
		});
		
		// Switch to work mode
		timerState.isWorkMode = true;
		timerState.secondsLeft = timerState.workDuration * 60;
	}
	
	saveState();
}

// Save state to storage
function saveState() {
	chrome.storage.local.set({ timerState: timerState });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.action) {
		case 'getState':
			// Calculate current seconds left if running
			if (timerState.isRunning && timerState.endTime) {
				const remaining = Math.round((timerState.endTime - Date.now()) / 1000);
				timerState.secondsLeft = Math.max(0, remaining);
			}
			sendResponse(timerState);
			break;
			
		case 'start':
			if (!timerState.isRunning && timerState.secondsLeft > 0) {
				startAlarm();
			}
			sendResponse(timerState);
			break;
			
		case 'stop':
			if (timerState.isRunning) {
				// Save current remaining time
				const remaining = Math.round((timerState.endTime - Date.now()) / 1000);
				timerState.secondsLeft = Math.max(0, remaining);
				stopAlarm();
			}
			sendResponse(timerState);
			break;
			
		case 'reset':
			stopAlarm();
			if (timerState.isWorkMode) {
				timerState.secondsLeft = timerState.workDuration * 60;
			} else {
				timerState.secondsLeft = timerState.breakDuration * 60;
			}
			saveState();
			sendResponse(timerState);
			break;
			
		case 'updateSettings':
			timerState.workDuration = message.workDuration;
			timerState.breakDuration = message.breakDuration;
			chrome.storage.sync.set({
				workDuration: message.workDuration,
				breakDuration: message.breakDuration
			});
			// Update current timer if not running
			if (!timerState.isRunning) {
				if (timerState.isWorkMode) {
					timerState.secondsLeft = timerState.workDuration * 60;
				} else {
					timerState.secondsLeft = timerState.breakDuration * 60;
				}
			}
			saveState();
			sendResponse(timerState);
			break;
	}
	return true; // Keep message channel open for async response
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
	console.log('Notification clicked:', notificationId);
});
