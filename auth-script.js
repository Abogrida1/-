// Auth Script - No Google Login
let currentStep = 1;
let registrationData = {};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const step = urlParams.get('step');
    const googleParam = urlParams.get('google');
    
    // If coming from register with google=true, remove google parameter
    if (googleParam === 'true') {
        // Remove google parameter and keep step
        const newUrl = window.location.pathname + (step ? '?step=' + step : '');
        window.history.replaceState({}, '', newUrl);
    }
    
    // Set initial step
    if (step) {
        currentStep = parseInt(step) || 1;
        updateSteps(currentStep);
    } else if (window.location.pathname.includes('register')) {
        // If on register page without step, set to step 1
        currentStep = 1;
        updateSteps(1);
    }
    
    // Setup login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Setup register form step 1
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveStep1Data();
        });
    }
    
    // Setup verification
    const verificationCode = document.getElementById('verification-code');
    if (verificationCode) {
        verificationCode.addEventListener('input', function() {
            if (this.value.length === 6) {
                verifyAndRegister();
            }
        });
    }
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me')?.checked || false;
    
    // Validate
    if (!email || !password) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showNotification('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
        return;
    }
    
    // Save session
    const sessionData = {
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        loginTime: new Date().toISOString()
    };
    
    if (rememberMe) {
        localStorage.setItem('user_session', JSON.stringify(sessionData));
    } else {
        sessionStorage.setItem('user_session', JSON.stringify(sessionData));
    }
    
    showNotification('تم تسجيل الدخول بنجاح', 'success');
    
    // Redirect to main page
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

// Registration Steps
function goToStep(step) {
    if (step < 1 || step > 3) return;
    
    // Save current step data
    if (currentStep === 1) {
        if (!saveStep1Data()) return;
    } else if (currentStep === 2) {
        if (!saveStep2Data()) return;
    }
    
    currentStep = step;
    updateSteps(step);
    updateURL();
}

function saveStep1Data() {
    const fullName = document.getElementById('full-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const phone = document.getElementById('phone')?.value;
    
    if (!fullName || !email || !phone) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('البريد الإلكتروني غير صحيح', 'error');
        return false;
    }
    
    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
    if (users.find(u => u.email === email)) {
        showNotification('هذا البريد الإلكتروني مستخدم بالفعل', 'error');
        return false;
    }
    
    registrationData = {
        fullName: fullName,
        email: email,
        phone: phone
    };
    
    return true;
}

function saveStep2Data() {
    const password = document.getElementById('register-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    const terms = document.getElementById('terms')?.checked;
    
    if (!password || !confirmPassword) {
        showNotification('يرجى ملء جميع الحقول', 'error');
        return false;
    }
    
    if (password.length < 8) {
        showNotification('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showNotification('كلمات المرور غير متطابقة', 'error');
        return false;
    }
    
    if (!terms) {
        showNotification('يجب الموافقة على الشروط والأحكام', 'error');
        return false;
    }
    
    registrationData.password = password;
    
    return true;
}

function updateSteps(step) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.add('hidden');
    });
    
    // Show current step form
    const currentForm = document.querySelector(`.auth-form[data-step="${step}"]`);
    if (currentForm) {
        currentForm.classList.remove('hidden');
    }
    
    // Update step indicators
    document.querySelectorAll('.step').forEach((stepEl, index) => {
        const stepNum = index + 1;
        if (stepNum <= step) {
            stepEl.classList.add('active');
            stepEl.classList.add('completed');
        } else {
            stepEl.classList.remove('active');
            stepEl.classList.remove('completed');
        }
    });
}

function updateURL() {
    const url = new URL(window.location);
    url.searchParams.set('step', currentStep);
    url.searchParams.delete('google'); // Remove google parameter if exists
    window.history.replaceState({}, '', url);
}

// Verification
function verifyAndRegister() {
    const code = document.getElementById('verification-code')?.value;
    
    if (!code || code.length !== 6) {
        showNotification('يرجى إدخال رمز التحقق (6 أرقام)', 'error');
        return;
    }
    
    // In production, verify code with backend
    // For now, accept any 6-digit code
    if (code.length === 6) {
        // Register user
        const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
        
        const newUser = {
            id: Date.now().toString(),
            ...registrationData,
            createdAt: new Date().toISOString(),
            verified: true
        };
        
        users.push(newUser);
        localStorage.setItem('registered_users', JSON.stringify(users));
        
        showNotification('تم إنشاء الحساب بنجاح', 'success');
        
        // Redirect to welcome page
        setTimeout(() => {
            window.location.href = 'welcome.html';
        }, 1000);
    } else {
        showNotification('رمز التحقق غير صحيح', 'error');
    }
}

function resendCode() {
    showNotification('تم إرسال رمز التحقق إلى بريدك الإلكتروني', 'info');
}

// Password Toggle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const eye = document.getElementById(inputId + '-eye');
    
    if (input.type === 'password') {
        input.type = 'text';
        eye.classList.remove('fa-eye');
        eye.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        eye.classList.remove('fa-eye-slash');
        eye.classList.add('fa-eye');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.parentNode.removeChild(notification);
            }, 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// Check if user is logged in
function checkAuth() {
    const session = sessionStorage.getItem('user_session') || localStorage.getItem('user_session');
    return session ? JSON.parse(session) : null;
}

// Logout
function logout() {
    sessionStorage.removeItem('user_session');
    localStorage.removeItem('user_session');
    window.location.href = '/auth/login.html';
}
