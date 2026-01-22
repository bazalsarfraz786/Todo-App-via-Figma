// js/auth.js - REGISTRATION & LOGIN SYSTEM

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

// === STATE ===
let isLoginMode = true; // true = Login, false = Sign Up

function initializeAuth() {
    // 1. Check if user is ALREADY logged in
    if(localStorage.getItem('isLoggedIn') === 'true') {
        // Redirect to app if trying to access login page
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
             window.location.href = 'pages/todo-app.html';
        }
    }

    // 2. Setup Form Listeners (Only if on index.html)
    const form = document.getElementById('authForm');
    if (form) {
        setupForm(form);
        setupToggle();
        setupPasswordToggle();
    }
}

// === FORM HANDLING ===
function setupForm(form) {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('errorMessage');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (isLoginMode) {
            handleLogin(email, password, form, errorMsg);
        } else {
            handleRegister(email, password, form, errorMsg);
        }
    });
}

// === REGISTER NEW USER ===
function handleRegister(email, password, form, errorMsg) {
    // Get existing users or create empty list
    let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    // Check if email already exists
    const userExists = users.find(u => u.email === email);
    
    if (userExists) {
        showError(form, errorMsg, "This email is already registered.");
        playErrorSound();
    } else {
        // Add new user
        users.push({ email: email, password: password });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        
        // Auto-login after register
        loginSuccess(email);
    }
}

// === LOGIN EXISTING USER ===
function handleLogin(email, password, form, errorMsg) {
    // 1. Get users list
    let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    // 2. Add the Default User (if not in list yet) to allow testing
    const defaultUser = { email: "user@example.com", password: "password123" };
    // Check if default is in the list, if not, treat it as valid anyway
    const isDefault = (email === defaultUser.email && password === defaultUser.password);

    // 3. Find user
    const validUser = users.find(u => u.email === email && u.password === password);

    if (validUser || isDefault) {
        loginSuccess(email);
    } else {
        showError(form, errorMsg, "Incorrect email or password.");
        playErrorSound();
    }
}

// === HELPERS ===
function loginSuccess(email) {
    const audio = new Audio('assets/success1.wav');
    audio.play().catch(e=>{});

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);

    // Show Success UI
    const btn = document.getElementById('submit-btn');
    btn.innerText = "Success! Redirecting...";
    btn.style.background = "#28a745"; // Green

    setTimeout(() => {
        // Redirect
        // Handle path differences (if file is in root vs pages)
        if (window.location.pathname.includes('pages')) {
            window.location.href = 'todo-app.html';
        } else {
            window.location.href = 'pages/todo-app.html';
        }
    }, 1500);
}

function showError(form, errorEl, msg) {
    errorEl.innerText = msg;
    errorEl.style.display = 'block';
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
}

function playErrorSound() {
    const audio = new Audio('assets/error.wav');
    audio.play().catch(e=>{});
}

// === UI TOGGLE (LOGIN <-> SIGN UP) ===
function setupToggle() {
    const toggleLink = document.getElementById('toggle-auth');
    const title = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const errorMsg = document.getElementById('errorMessage');

    toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode; // Switch mode
        
        // Clear errors
        errorMsg.style.display = 'none';

        if (isLoginMode) {
            title.innerText = "Log In";
            submitBtn.innerText = "Log In";
            toggleText.innerHTML = `Don't have an account? <a href="#" id="toggle-auth">Sign Up</a>`;
        } else {
            title.innerText = "Create Account";
            submitBtn.innerText = "Sign Up";
            toggleText.innerHTML = `Already have an account? <a href="#" id="toggle-auth">Log In</a>`;
        }
        
        // Re-attach listener to new link since we overwrote HTML
        setupToggle();
    });
}

function setupPasswordToggle() {
    const btn = document.getElementById('showPassword');
    const input = document.getElementById('password');
    if(btn && input) {
        btn.addEventListener('click', () => {
            if(input.type === "password") {
                input.type = "text";
                btn.innerText = "Hide";
            } else {
                input.type = "password";
                btn.innerText = "Show";
            }
        });
    }
}

// Global logout function
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = '../index.html';
}