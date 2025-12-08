const AuthSimulator = (function() {
  'use strict';

  const USERS_KEY = 'digital-mira-users';
  const SESSION_KEY = 'digital-mira-session';

  function init() {
    if (!getUsers()) {
      localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
    bindEvents();
  }

  function bindEvents() {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const logoutBtns = document.querySelectorAll('.logout-btn');

    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
    }

    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }

    logoutBtns.forEach(function(btn) {
      btn.addEventListener('click', handleLogout);
    });

    setupPasswordToggles();
    setupRealTimeValidation();
  }

  function setupPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(function(toggle) {
      toggle.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    });
  }

  function setupRealTimeValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const nameInputs = document.querySelectorAll('input[name="name"]');

    emailInputs.forEach(function(input) {
      input.addEventListener('blur', function() {
        validateEmail(this);
      });
    });

    passwordInputs.forEach(function(input) {
      input.addEventListener('input', function() {
        validatePassword(this);
      });
    });

    nameInputs.forEach(function(input) {
      input.addEventListener('blur', function() {
        validateName(this);
      });
    });
  }

  function validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errorEl = input.parentElement.querySelector('.form-error') || 
                    input.parentElement.parentElement.querySelector('.form-error');

    if (!email) {
      setError(input, errorEl, 'Email is required');
      return false;
    }

    if (!emailRegex.test(email)) {
      setError(input, errorEl, 'Please enter a valid email address');
      return false;
    }

    clearError(input, errorEl);
    return true;
  }

  function validatePassword(input) {
    const password = input.value;
    const errorEl = input.parentElement.querySelector('.form-error') ||
                    input.parentElement.parentElement.querySelector('.form-error');
    const isSignup = input.closest('#signup-form');

    if (!password) {
      setError(input, errorEl, 'Password is required');
      return false;
    }

    if (isSignup && password.length < 8) {
      setError(input, errorEl, 'Password must be at least 8 characters');
      return false;
    }

    clearError(input, errorEl);
    return true;
  }

  function validateName(input) {
    const name = input.value.trim();
    const errorEl = input.parentElement.querySelector('.form-error');

    if (!name) {
      setError(input, errorEl, 'Name is required');
      return false;
    }

    if (name.length < 2) {
      setError(input, errorEl, 'Name must be at least 2 characters');
      return false;
    }

    clearError(input, errorEl);
    return true;
  }

  function setError(input, errorEl, message) {
    input.classList.add('error');
    input.classList.remove('success');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearError(input, errorEl) {
    input.classList.remove('error');
    input.classList.add('success');
    if (errorEl) {
      errorEl.classList.remove('visible');
    }
  }

  function handleSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const name = form.querySelector('input[name="name"]').value.trim();
    const email = form.querySelector('input[name="email"]').value.trim().toLowerCase();
    const password = form.querySelector('input[name="password"]').value;
    const alertContainer = document.getElementById('signup-alert');

    const nameInput = form.querySelector('input[name="name"]');
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');

    let isValid = true;
    isValid = validateName(nameInput) && isValid;
    isValid = validateEmail(emailInput) && isValid;
    isValid = validatePassword(passwordInput) && isValid;

    if (!isValid) {
      showAlert(alertContainer, 'Please fix the errors above', 'error');
      return;
    }

    const users = getUsers();
    
    if (users.find(function(u) { return u.email === email; })) {
      showAlert(alertContainer, 'An account with this email already exists', 'error');
      return;
    }

    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      password: hashPassword(password),
      createdAt: new Date().toISOString(),
      progress: {
        transit: 0,
        shield: 0,
        udyam: 0
      }
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    createSession(newUser);
    
    showAlert(alertContainer, 'Account created successfully! Redirecting...', 'success');
    
    setTimeout(function() {
      window.location.href = 'dashboard.html';
    }, 1500);
  }

  function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.querySelector('input[name="email"]').value.trim().toLowerCase();
    const password = form.querySelector('input[name="password"]').value;
    const rememberMe = form.querySelector('input[name="remember"]');
    const alertContainer = document.getElementById('login-alert');

    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');

    let isValid = true;
    isValid = validateEmail(emailInput) && isValid;
    isValid = validatePassword(passwordInput) && isValid;

    if (!isValid) {
      showAlert(alertContainer, 'Please fix the errors above', 'error');
      return;
    }

    const users = getUsers();
    const user = users.find(function(u) { 
      return u.email === email && u.password === hashPassword(password); 
    });

    if (!user) {
      showAlert(alertContainer, 'Invalid email or password', 'error');
      return;
    }

    createSession(user, rememberMe && rememberMe.checked);
    
    showAlert(alertContainer, 'Login successful! Redirecting...', 'success');
    
    setTimeout(function() {
      window.location.href = 'dashboard.html';
    }, 1000);
  }

  function handleLogout(e) {
    e.preventDefault();
    destroySession();
    window.location.href = 'index.html';
  }

  function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16);
  }

  function createSession(user, persistent) {
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      createdAt: new Date().toISOString()
    };

    if (persistent) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }

  function destroySession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }

  function getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session) return null;

    const users = getUsers();
    return users.find(function(u) { return u.id === session.userId; }) || null;
  }

  function updateUserProgress(module, progress) {
    const session = getSession();
    if (!session) return;

    const users = getUsers();
    const userIndex = users.findIndex(function(u) { return u.id === session.userId; });
    
    if (userIndex !== -1) {
      users[userIndex].progress[module] = Math.min(100, Math.max(0, progress));
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  }

  function showAlert(container, message, type) {
    if (!container) return;
    
    container.innerHTML = '<div class="alert alert-' + type + '">' +
      '<i class="fas fa-' + (type === 'success' ? 'check-circle' : 'exclamation-circle') + '"></i>' +
      '<span>' + message + '</span>' +
    '</div>';
    
    container.style.display = 'block';
  }

  function isAuthenticated() {
    return getSession() !== null;
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  function requireGuest() {
    if (isAuthenticated()) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }

  return {
    init: init,
    isAuthenticated: isAuthenticated,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    updateProgress: updateUserProgress,
    logout: handleLogout,
    requireAuth: requireAuth,
    requireGuest: requireGuest
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  AuthSimulator.init();
});
