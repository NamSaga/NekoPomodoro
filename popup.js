// Local state (synced from background)
let isRunning = false;
let secondsLeft = 25 * 60;
let isWorkMode = true;
let pomodoroCount = 0;
let updateInterval;

// DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const modeIndicator = document.getElementById('modeIndicator');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const workDurationInput = document.getElementById('workDuration');
const breakDurationInput = document.getElementById('breakDuration');
const pomodoroCountElement = document.getElementById('pomodoroCount');

// Initialize popup
function init() {
	setupEventListeners();
	loadStateFromBackground();
	// Poll for updates while popup is open
	updateInterval = setInterval(loadStateFromBackground, 500);
}

// Load state from background script
function loadStateFromBackground() {
	chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
		if (state) {
			secondsLeft = state.secondsLeft;
			isRunning = state.isRunning;
			isWorkMode = state.isWorkMode;
			pomodoroCount = state.pomodoroCount;
			workDurationInput.value = state.workDuration;
			breakDurationInput.value = state.breakDuration;
			updateUI();
		}
	});
}

// Update UI based on current state
function updateUI() {
	updateDisplay();
	pomodoroCountElement.textContent = pomodoroCount;
	
	if (isRunning) {
		startBtn.textContent = 'Pause';
		startBtn.classList.add('pause-btn');
		startBtn.classList.remove('start-btn');
	} else {
		startBtn.textContent = 'Start';
		startBtn.classList.add('start-btn');
		startBtn.classList.remove('pause-btn');
	}
	
	if (isWorkMode) {
		modeIndicator.innerHTML = '<span class="mode work-mode">WORK MODE</span>';
	} else {
		modeIndicator.innerHTML = '<span class="mode break-mode">BREAK MODE</span>';
	}
}

// Setup event listeners
function setupEventListeners() {
	startBtn.addEventListener('click', toggleTimer);
	resetBtn.addEventListener('click', resetTimer);
	workDurationInput.addEventListener('change', updateSettings);
	breakDurationInput.addEventListener('change', updateSettings);
}

// Toggle timer start/stop
function toggleTimer() {
	if (isRunning) {
		chrome.runtime.sendMessage({ action: 'stop' }, (state) => {
			if (state) {
				isRunning = state.isRunning;
				secondsLeft = state.secondsLeft;
				updateUI();
			}
		});
	} else {
		chrome.runtime.sendMessage({ action: 'start' }, (state) => {
			if (state) {
				isRunning = state.isRunning;
				updateUI();
			}
		});
	}
}

// Reset the timer
function resetTimer() {
	chrome.runtime.sendMessage({ action: 'reset' }, (state) => {
		if (state) {
			secondsLeft = state.secondsLeft;
			isRunning = state.isRunning;
			updateUI();
		}
	});
}

// Update the timer display
function updateDisplay() {
	const minutes = Math.floor(secondsLeft / 60);
	const seconds = secondsLeft % 60;
	timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Update settings in background
function updateSettings() {
	chrome.runtime.sendMessage({
		action: 'updateSettings',
		workDuration: parseInt(workDurationInput.value),
		breakDuration: parseInt(breakDurationInput.value)
	}, (state) => {
		if (state) {
			secondsLeft = state.secondsLeft;
			updateUI();
		}
	});
}

// Cleanup when popup closes
window.addEventListener('unload', () => {
	if (updateInterval) {
		clearInterval(updateInterval);
	}
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', init);
