// js/todo.js - MULTI-USER SUPPORT ADDED

// === 1. GET CURRENT USER ===
// We need to know WHO is logged in to load the correct data
const currentUser = localStorage.getItem('userEmail');

if (!currentUser) {
    // If no one is logged in, send them back to login page
    window.location.href = '../index.html';
}

// === 2. DEFINE DYNAMIC KEYS ===
// We create unique storage keys based on the email
// e.g., "tasks_john@gmail.com" vs "tasks_mary@gmail.com"
const TASKS_KEY = `tasks_${currentUser}`;
const LOCATIONS_KEY = `locations_${currentUser}`;

// === 3. LOAD DATA FOR THIS SPECIFIC USER ===
let tasks = JSON.parse(localStorage.getItem(TASKS_KEY)) || [];
let locations = JSON.parse(localStorage.getItem(LOCATIONS_KEY)) || [];
let currentReminderTask = null;

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    // Verify login logic from auth.js
    if(typeof checkLoginStatus === 'function') {
        checkLoginStatus();
    }
    
    // Render THIS user's data
    renderTasks();
    renderLocations();
    
    // Start Reminder Clock
    setInterval(checkReminders, 10000);
});

// === HELPER: SAVE TO SPECIFIC USER STORAGE ===
function updateLocalStorage() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
    updateProgress(); // Update the bar whenever we save
}

// === NAVIGATION ===
function switchTab(tab) {
    document.getElementById('view-task').style.display = tab === 'task' ? 'block' : 'none';
    document.getElementById('view-location').style.display = tab === 'location' ? 'block' : 'none';
    
    document.getElementById('nav-task').className = tab === 'task' ? 'nav-button active' : 'nav-button';
    document.getElementById('nav-location').className = tab === 'location' ? 'nav-button active' : 'nav-button';
}

function handleLogout() {
    if(typeof logout === 'function') {
        logout();
    } else {
        window.location.href = '../index.html';
    }
}

// === MODALS ===
function openModal(id) {
    document.getElementById(id).classList.add('active');
    if(id === 'location-modal') detectLocation();
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// === TASK LOGIC ===
function saveTask() {
    const summary = document.getElementById('task-summary').value;
    const desc = document.getElementById('task-desc').value;
    const date = document.getElementById('task-date').value;

    if (!summary) {
        alert("Please enter a task summary");
        return;
    }

    const newTask = {
        id: Date.now(),
        summary: summary,
        description: desc,
        dueDate: date,
        completed: false
    };

    tasks.push(newTask);
    updateLocalStorage(); // Saves to "tasks_user@email.com"
    renderTasks();
    closeModal('task-modal');
    
    // Reset inputs
    document.getElementById('task-summary').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-date').value = '';
}

function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        updateLocalStorage();
        renderTasks();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    updateLocalStorage();
    renderTasks();
}

function renderTasks() {
    const incList = document.getElementById('incomplete-list');
    const comList = document.getElementById('completed-list');
    
    incList.innerHTML = '';
    comList.innerHTML = '';

    tasks.forEach(task => {
        let dateDisplay = '';
        if (task.dueDate) {
            const dateObj = new Date(task.dueDate);
            dateDisplay = `<div class="task-date"><i class="far fa-clock"></i> ${dateObj.toLocaleString()}</div>`;
        }

        const html = `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus(${task.id})">
                </div>
                <div class="task-content">
                    <div class="task-text">${task.summary}</div>
                    ${dateDisplay}
                </div>
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        if (task.completed) {
            comList.innerHTML += html;
        } else {
            incList.innerHTML += html;
        }
    });
    
    updateProgress();
}

// === PROGRESS BAR ===
function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const fill = document.getElementById('progress-fill');
    const text = document.getElementById('progress-text');
    
    if(fill) fill.style.width = `${percent}%`;
    if(text) text.innerText = `${percent}%`;
}

// === LOCATION LOGIC ===
function detectLocation() {
    const coordsInput = document.getElementById('loc-coords');
    const nameInput = document.getElementById('loc-name');

    if (navigator.geolocation) {
        // 1. Visual Feedback: Clear fields so user knows it is retrying
        coordsInput.value = "Detecting...";
        nameInput.value = ""; 
        nameInput.placeholder = "Fetching address...";
        
        // 2. Force High Accuracy
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                coordsInput.value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

                try {
                    // Free Address API
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await response.json();
                    
                    if (data && data.display_name) {
                        let address = data.display_name.split(',').slice(0, 3).join(',');
                        nameInput.value = address; 
                    }
                } catch (error) {
                    console.error("Error getting address:", error);
                    nameInput.placeholder = "Address not found";
                }
            },
            (error) => {
                coordsInput.value = "Retry failed";
                alert("Could not detect location. Please try again.");
            },
            options
        );
    } else {
        coordsInput.value = "Not supported";
    }
}

function saveLocation() {
    const name = document.getElementById('loc-name').value;
    const coords = document.getElementById('loc-coords').value;

    if (!name) {
        alert("Please enter a location name");
        return;
    }

    const newLocation = {
        id: Date.now(),
        name: name,
        coords: coords,
        timestamp: new Date().toLocaleString()
    };

    locations.unshift(newLocation);
    updateLocalStorage(); // Saves to "locations_user@email.com"
    renderLocations();
    closeModal('location-modal');
    document.getElementById('loc-name').value = '';
}

function deleteLocation(id) {
    locations = locations.filter(l => l.id !== id);
    updateLocalStorage();
    renderLocations();
}

function renderLocations() {
    const list = document.getElementById('location-list');
    list.innerHTML = '';
    
    locations.forEach(loc => {
        list.innerHTML += `
            <div class="location-item">
                <div class="loc-row">
                    <div class="loc-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div class="loc-details">
                        <h4>${loc.name}</h4>
                        <p>${loc.coords}</p>
                    </div>
                    <button class="btn-delete" onclick="deleteLocation(${loc.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

// === REMINDER SYSTEM ===
function checkReminders() {
    const now = new Date();
    
    tasks.forEach(task => {
        if (!task.completed && task.dueDate) {
            const taskTime = new Date(task.dueDate);
            
            // Trigger if time matches (within last minute)
            if (taskTime <= now && taskTime > new Date(now - 60000)) {
                showReminder(task);
            }
        }
    });
}

function showReminder(task) {
    const toast = document.getElementById('reminder-toast');
    document.getElementById('reminder-title').innerText = task.summary;
    
    // Safe date formatting
    const timeStr = new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    document.getElementById('reminder-time').innerText = `Time: ${timeStr}`;
    
    toast.classList.add('active');
    
    // Play Notification Sound
    const audio = new Audio('../assets/notification.wav');
    audio.play().catch(e => console.log("Audio play failed (interaction required)", e));
}

function dismissReminder() {
    document.getElementById('reminder-toast').classList.remove('active');
}