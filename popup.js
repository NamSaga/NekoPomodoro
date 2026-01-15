//Timer variables
let timer;
let secondsLeft = 25 * 60; // Default to 25 minutes
let isrunning = false;
let isWorkMode = true;
let pomodoroCount = 0;

// DOM elements
const timerDisplay = document.getElementById('timerDisplay');
const modeIndicator = document.getElementById('modeIndicator');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const workDurationInput = document.getElementById('workDuration');

// Initialize timer timerDisplay
function init() {
	loadSettings();
	loadPomodoroCount();
	updateDisplay();
	setupEventListeners();
}

//Load settings from storage
function loadSettings() {
	chrome.storage.sync.get(['workDuration'], (data) => {
		if (data.workDuration) {
			workDurationInput.value = data.workDuration;
			seconds = data.workDuration * 60;
		}
		if (!data.workDuration) {
			workDurationInput.value = data.breakDuration;
		}
		updateDisplay();
	});
}

//Load pomodoro count from storage
function loadPomodoroCount() {
	chrome.storage.sync.get(['pomodoroCount'], (data) => {
			pomodoroCount = data.pomodoroCount || 0;
			pomodoroCountElement.textContent = pomodoroCount;			
	});
}

//Setup event listeners
function setupEventListeners() {
	startBtn.addEventListener('click', toggleTimer);
	resetBtn.addEventListener('click', resetTimer);
	workDurationInput.addEventListener('change', updateWorkDuration);
	breakDurationInput.addEventListener('change', updateBreakDuration);
}

//Toggle timer start/stop
function toggleTimer() {
	if (isrunning) {
		stopTimer();
	} else {
		startTimer();
	}
}

//Start the timer
function startTimer() {
	if (secondsLeft <= 0) return;
	isrunning = true;
	startBtn.textContent = 'Pause';
	startBtn.classList.add('pause');
	startBtn.classList.remove('start-btn');

	timer = setInterval(() => {
		secondsLeft--;
		updateDisplay();

		if (secondsLeft <= 0) {
			completePhase();
		}
	}, 1000);
}

// Save settings when timer starts 
saveSettings();

//Stop the timer
function stopTimer() {
	isrunning = false;
	startBtn.textContent = 'Start';
	startBtn.classList.add('start-btn');
	startBtn.classList.remove('pause-btn');
}

//Reset the timer 
function resetTimer() {
	stopTimer();
	if (isWorkMode) {
		secondsLeft = workDurationInput.value * 60;
	} else {
		secondsLeft = breakDurationInput.value * 60;
	}
	updateDisplay();
}

//Complete the current phase 
function completePhase() {
	stopTimer();
	if (isWorkMode) {
		//work phase complete
		pomodoroCount++;
		pomodoroCountElement.textContent = pomodoroCount;
		chrome.storage.sync.set({ pomodoroCount: pomodoroCount });

		//show notification
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon.png',
			title: 'Pomodoro Complete!',
			message: 'Time for a break!'
			priority: 2
		});

		//switch to break mode 
		isWorkMode = false;
		secondsLeft = breakDurationInput.value * 60;
		modeIndicator.innerHTML = '<span class="mode break-mode">BREAK MODE</span>';
	} else {
		//break phase complete
		chrome.notifications.create({
			type: 'basic',
			iconUrl: 'icons/icon.png',
			title: 'Break Over!',
			message: 'Time to get back to work!'
			priority: 2
		});

		//switch to work mode 
		isWorkMode = true;
		secondsLeft = workDurationInput.value * 60;
		modeIndicator.innerHTML = '<span class="mode work-mode">WORK MODE</span>';
	}

	updateDisplay();

	//Auto start next phase 
	setTimeout(() => {
		if (confirm(isWorkMode ? 
			'Break over! Start work session?' (${workDurationInput.value} minutes) ?' :
			'Work session complete! Start break?' (${breakDurationInput.value} minutes) ?')) {
			startTimer();
		}
	}, 3000);
}

//Update the timer display 
function updateDisplay() {
	const minutes = Math.floor(secondsLeft / 60);
	const seconds = secondsLeft % 60;
	timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

//Update work duration
function updateWorkDuration() {
	if (!isrunning && isWorkMode) {
		secondsLeft = workDurationInput.value * 60;
		updateDisplay();
	}
	updateSettings();
}

//Update break duration
function updateBreakDuration() {
	if (!isrunning && !isWorkMode) {
		secondsLeft = breakDurationInput.value * 60;
		updateDisplay();
	}
	updateSettings();
}

//Save settings to storage
function updateSettings() {
	chrome.storage.sync.set({
		workDuration: parseInt(workDurationInput.value),
		breakDuration: parseInt(breakDurationInput.value)
	});
}

//Initialize the popup
document.addEventListener('DOMContentLoaded', init);
