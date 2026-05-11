/**
 * PromptForge AI - Script
 * AI-Powered Prompt Enhancement Tool
 */

// ========================================
// DOM Elements
// ========================================
const navbar = document.getElementById('navbar');
const navLinks = document.getElementById('navLinks');
const hamburger = document.getElementById('hamburger');
const themeToggle = document.getElementById('themeToggle');
const promptInput = document.getElementById('promptInput');
const charCount = document.getElementById('charCount');
const toneDropdown = document.getElementById('toneDropdown');
const enhanceBtn = document.getElementById('enhanceBtn');
const outputContent = document.getElementById('outputContent');
const statusBadge = document.getElementById('statusBadge');
const readBtn = document.getElementById('readBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const loginBtn = document.getElementById('loginBtn');
const loginBtnMobile = document.getElementById('loginBtnMobile');
const signupBtnMobile = document.getElementById('signupBtnMobile');
const logoutBtnMobile = document.getElementById('logoutBtnMobile');
const deleteAccountBtnMobile = document.getElementById('deleteAccountBtnMobile');

// Delete account confirm modal elements
const confirmOverlay = document.getElementById('confirmOverlay');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const confirmPasswordInput = document.getElementById('confirmPasswordInput');
const confirmError = document.getElementById('confirmError');

// Auth Modal elements
const authModal = document.getElementById('authModal');
const authModalClose = document.getElementById('authModalClose');
const loginFormSection = document.getElementById('loginForm');
const signupFormSection = document.getElementById('signupForm');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const loginFormEl = document.getElementById('loginFormEl');
const signupFormEl = document.getElementById('signupFormEl');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const passwordToggleButtons = document.querySelectorAll('.password-toggle');

// ========================================
// Auth State Management
// ========================================
function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getAuthUser() {
    const u = localStorage.getItem('authUser');
    return u ? JSON.parse(u) : null;
}

function isLoggedIn() {
    return !!getAuthToken();
}

function setDisplay(el, value) {
    if (el) el.style.display = value;
}

function updateAuthUI() {
    const loggedIn = isLoggedIn();
    if (loggedIn) {
        setDisplay(loginBtn, 'none');
        setDisplay(loginBtnMobile, 'none');
        setDisplay(signupBtnMobile, 'none');
        setDisplay(logoutBtnMobile, 'inline-flex');
        setDisplay(deleteAccountBtnMobile, 'inline-flex');
    } else {
        setDisplay(loginBtn, 'inline-flex');
        setDisplay(loginBtnMobile, 'inline-flex');
        setDisplay(signupBtnMobile, 'inline-flex');
        setDisplay(logoutBtnMobile, 'none');
        setDisplay(deleteAccountBtnMobile, 'none');
    }
}

function resetPasswordVisibility() {
    passwordToggleButtons.forEach((btn) => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;
        input.type = 'password';
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-label', 'Show password');
    });
}

function openAuthModal(mode) {
    authModal.style.display = 'flex';
    loginError.textContent = '';
    signupError.textContent = '';
    resetPasswordVisibility();
    if (mode === 'signup') {
        loginFormSection.style.display = 'none';
        signupFormSection.style.display = 'block';
    } else {
        loginFormSection.style.display = 'block';
        signupFormSection.style.display = 'none';
    }
}

function closeAuthModal() {
    authModal.style.display = 'none';
    resetPasswordVisibility();
}

function openDeleteConfirmModal() {
    if (confirmError) confirmError.textContent = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    if (confirmOverlay) confirmOverlay.style.display = 'flex';
}

function closeDeleteConfirmModal() {
    if (confirmOverlay) confirmOverlay.style.display = 'none';
    if (confirmError) confirmError.textContent = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
}

async function handleDeleteAccount() {
    const token = getAuthToken();
    if (!token) {
        showToast('Please log in first');
        return;
    }

    const password = String(confirmPasswordInput?.value || '').trim();
    if (!password) {
        if (confirmError) confirmError.textContent = 'Password is required.';
        return;
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';
    }

    try {
        const res = await fetch('/api/auth/account', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Delete account failed');

        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        updateAuthUI();
        closeDeleteConfirmModal();
        closeMobileMenu();
        showToast('Account deleted successfully');
    } catch (error) {
        if (confirmError) confirmError.textContent = error.message;
    } finally {
        if (confirmDeleteBtn) {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.textContent = 'Delete Account';
        }
    }
}

// Modal open/close handlers
if (loginBtn) loginBtn.addEventListener('click', () => openAuthModal('login'));
if (loginBtnMobile) loginBtnMobile.addEventListener('click', () => openAuthModal('login'));
if (signupBtnMobile) signupBtnMobile.addEventListener('click', () => openAuthModal('signup'));
if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
if (authModal) authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });
if (showSignupLink) showSignupLink.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('signup'); });
if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('login'); });

passwordToggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
        btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
});

// Login form submit
loginFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const btn = loginFormEl.querySelector('.auth-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        updateAuthUI();
        closeAuthModal();
        showToast(`Welcome back, ${data.user.name}!`);
        loginFormEl.reset();
    } catch (err) {
        loginError.textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Log In';
    }
});

// Signup form submit
signupFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    signupError.textContent = '';
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const btn = signupFormEl.querySelector('.auth-submit-btn');

    if (password !== confirmPassword) {
        signupError.textContent = 'Passwords do not match.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing up...';

    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');

        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        updateAuthUI();
        closeAuthModal();
        showToast(`Welcome, ${data.user.name}!`);
        signupFormEl.reset();
        resetPasswordVisibility();
    } catch (err) {
        signupError.textContent = err.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign Up';
    }
});

// Logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    updateAuthUI();
    closeDeleteConfirmModal();
    showToast('Logged out successfully!');
}

logoutBtnMobile.addEventListener('click', handleLogout);
if (deleteAccountBtnMobile) {
    deleteAccountBtnMobile.addEventListener('click', openDeleteConfirmModal);
}
if (confirmCancelBtn) confirmCancelBtn.addEventListener('click', closeDeleteConfirmModal);
if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleDeleteAccount);
if (confirmOverlay) {
    confirmOverlay.addEventListener('click', (e) => {
        if (e.target === confirmOverlay) closeDeleteConfirmModal();
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && confirmOverlay && confirmOverlay.style.display === 'flex') {
        closeDeleteConfirmModal();
    }
});

// Initialize auth UI on load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    resetPasswordVisibility();
});

// ========================================
// Configuration
// ========================================
const CONFIG = {
    // Backend API URL - automatically detects local vs production
    apiUrl: window.location.origin,
};

// ========================================
// Theme Management
// ========================================

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// ========================================
// Navbar Functionality
// ========================================

/**
 * Handle navbar scroll effects
 */
function handleScroll() {
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    updateActiveNavOnScroll();
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
}

/**
 * Close mobile menu when clicking a link
 */
function closeMobileMenu() {
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
}

/**
 * Set active navbar link by href
 * @param {string} href - Section href (e.g. '#about')
 */
function setActiveNavLink(href) {
    const sectionLinks = navLinks.querySelectorAll('.nav-link[href^="#"]');
    sectionLinks.forEach((link) => {
        if (link.getAttribute('href') === href) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Update active nav item based on current scroll position
 */
function updateActiveNavOnScroll() {
    const sectionLinks = navLinks.querySelectorAll('.nav-link[href^="#"]');
    const sections = Array.from(sectionLinks)
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    if (!sections.length) return;

    const navbarHeight = navbar.offsetHeight;
    const scrollY = window.scrollY + navbarHeight + 40;
    let currentId = '#home';

    sections.forEach((section) => {
        if (scrollY >= section.offsetTop) {
            currentId = `#${section.id}`;
        }
    });

    setActiveNavLink(currentId);
}

// ========================================
// Textarea Auto-resize
// ========================================

/**
 * Auto-resize textarea based on content
 */
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

/**
 * Update character counter
 */
function updateCharCount() {
    charCount.textContent = `${promptInput.value.length} chars`;
}

// ========================================
// Toast Notifications
// ========================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'success', duration = 3000) {
    toastMessage.textContent = message;
    
    // Update icon based on type
    const toastIcon = toast.querySelector('.toast-icon');
    if (toastIcon) {
        if (type === 'error') {
            toastIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            `;
            // Optional: add a slight red tint to background
            toast.style.borderLeft = '4px solid #ef4444';
        } else {
            toastIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            toast.style.borderLeft = 'none';
        }
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ========================================
// API Integration
// ========================================

/**
 * Update status badge state
 * @param {string} state - 'ready', 'processing', 'success', 'error'
 */
function updateStatusBadge(state) {
    if (!statusBadge) return;
    
    statusBadge.classList.remove('processing', 'error');
    
    switch(state) {
        case 'processing':
            statusBadge.textContent = 'Processing...';
            statusBadge.classList.add('processing');
            break;
        case 'success':
            statusBadge.textContent = 'Enhanced';
            break;
        case 'error':
            statusBadge.textContent = 'Error';
            statusBadge.classList.add('error');
            break;
        default:
            statusBadge.textContent = 'Ready';
    }
}

/**
 * Enhance prompt using backend API
 */
async function enhancePrompt() {
    // Stop reading output if active
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    // Stop voice recognition if it is still taking inputs
    if (typeof isRecording !== 'undefined' && isRecording) {
        stopVoiceRecording();
    }

    const prompt = promptInput.value.trim();
    
    // Validate input
    if (!prompt) {
        showToast('Please enter a prompt to enhance');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    updateStatusBadge('processing');
    
    try {
        // Call backend API (include auth token if logged in for history saving)
        const headers = { 'Content-Type': 'application/json' };
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        const response = await fetch(`${CONFIG.apiUrl}/api/enhance`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                prompt: prompt,
                tone: toneDropdown.value
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        displayOutput(data.enhancedPrompt);
        updateStatusBadge('success');
        showToast('Prompt enhanced successfully!');
        
    } catch (error) {
        console.error('Error enhancing prompt:', error);
        updateStatusBadge('error');
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Set loading state for enhance button
 * @param {boolean} isLoading - Loading state
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        enhanceBtn.classList.add('loading');
        enhanceBtn.disabled = true;
    } else {
        enhanceBtn.classList.remove('loading');
        enhanceBtn.disabled = false;
    }
}

/**
 * Display output in the output panel
 * @param {string} content - Content to display
 */
function displayOutput(content) {
    outputContent.textContent = content;
    
    // Scroll to output on mobile
    if (window.innerWidth < 900) {
        outputContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ========================================
// Output Actions
// ========================================

/**
 * Copy output to clipboard
 */
async function copyToClipboard() {
    const content = outputContent.textContent.trim();
    
    // Check if content is empty or just the placeholder
    if (!content || content.includes('Your enhanced prompt will appear here')) {
        showToast('Nothing to copy');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(content);
        showToast('Copied to clipboard!');
    } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied to clipboard!');
    }
}

/**
 * Clear output and input
 */
function clearOutput() {
    // Reset output area to placeholder
    outputContent.innerHTML = `
        <div class="output-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <p>Your enhanced prompt will appear here</p>
            <span>Enter a prompt and click enhance to begin</span>
        </div>
    `;
    promptInput.value = '';
    updateCharCount();
    updateStatusBadge('ready');
    showToast('Cleared');
}

// ========================================
// Contact Form
// ========================================

/**
 * Handle contact form submission (frontend only)
 * @param {Event} e - Form submit event
 */
function handleContactSubmit(e) {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Log for demo purposes
    console.log('Contact form submitted:', { name, email, message });
    
    // Show success toast
    showToast('Message sent! We will get back to you soon.');
    
    // Reset form
    contactForm.reset();
}

// ========================================
// Event Listeners
// ========================================

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();
    
    // Initialize character count
    updateCharCount();

    // Ensure nav highlight matches current viewport/hash on load
    if (window.location.hash && navLinks.querySelector(`.nav-link[href="${window.location.hash}"]`)) {
        setActiveNavLink(window.location.hash);
    } else {
        updateActiveNavOnScroll();
    }

    handleScroll();
});

// Scroll events
window.addEventListener('scroll', handleScroll);

// Theme toggle
themeToggle.addEventListener('click', toggleTheme);

// Mobile menu
hamburger.addEventListener('click', toggleMobileMenu);

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// Textarea events
promptInput.addEventListener('input', () => {
    updateCharCount();
    autoResizeTextarea(promptInput);
});

// Enhance button
enhanceBtn.addEventListener('click', enhancePrompt);

// Allow Ctrl+Enter to enhance
promptInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        enhancePrompt();
    }
});

// Read Output button
if (readBtn) {
    const speakerIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="4" width="4" height="16"></rect>
        <rect x="14" y="4" width="4" height="16"></rect>
    </svg>`;

    const updateIcon = (icon) => {
        readBtn.innerHTML = icon;
    };

    // Ensure we start with speaker icon
    updateIcon(speakerIcon);

    let isCurrentlySpeaking = false;

    const stopReading = () => {
        window.speechSynthesis.cancel();
        isCurrentlySpeaking = false;
        updateIcon(speakerIcon);
    };

    readBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const content = outputContent.textContent.trim();
        if (!content || content.includes('Your enhanced prompt will appear here')) {
            showToast('Nothing to read');
            return;
        }

        if (isCurrentlySpeaking) {
            // Stop reading completely
            stopReading();
            showToast('Stopped reading');
        } else {
            // Cancel any stale TTS state 
            window.speechSynthesis.cancel();

            // Start reading from the beginning
            setTimeout(() => {
                window.currentUtterance = new SpeechSynthesisUtterance(content);
                
                window.currentUtterance.onend = () => stopReading();
                window.currentUtterance.onerror = (e) => {
                    if (e.error !== 'canceled' && e.error !== 'interrupted') {
                        stopReading();
                    }
                };

                window.speechSynthesis.speak(window.currentUtterance);
                isCurrentlySpeaking = true;
                updateIcon(pauseIcon);
                showToast('Started reading');
            }, 50);
        }
    });
}

// Copy button
copyBtn.addEventListener('click', copyToClipboard);

// Clear button
clearBtn.addEventListener('click', clearOutput);

// Clear input button
const clearInputBtn = document.getElementById('clearInputBtn');
if (clearInputBtn) {
    clearInputBtn.addEventListener('click', () => {
        promptInput.value = '';
        updateCharCount();
        showToast('Input cleared');
    });
}

// ========================================
// Voice Input (Web Speech API)
// ========================================

const voiceInputBtn = document.getElementById('voiceInputBtn');
const voiceIndicator = document.getElementById('voiceIndicator');
const voiceIndicatorText = voiceIndicator ? voiceIndicator.querySelector('.voice-indicator-text') : null;

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecording = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Track position where voice text insertion starts
    let voiceInsertStart = 0;

    recognition.onstart = () => {
        isRecording = true;
        voiceInputBtn.classList.add('recording');
        if (voiceIndicator) voiceIndicator.style.display = 'flex';
        if (voiceIndicatorText) voiceIndicatorText.textContent = 'Listening... Speak now';
        voiceInsertStart = promptInput.value.length;
        // Add a space separator if textarea already has content
        if (voiceInsertStart > 0 && !promptInput.value.endsWith(' ') && !promptInput.value.endsWith('\n')) {
            promptInput.value += ' ';
            voiceInsertStart = promptInput.value.length;
        }
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Build the current value: original text + final so far + interim preview
        const baseText = promptInput.value.substring(0, voiceInsertStart);

        if (finalTranscript) {
            // Commit final text permanently
            promptInput.value = baseText + finalTranscript;
            voiceInsertStart = promptInput.value.length;
            updateCharCount();
        }

        // Show interim text as a live preview in the indicator
        if (interimTranscript && voiceIndicatorText) {
            voiceIndicatorText.textContent = interimTranscript.length > 60
                ? '...' + interimTranscript.slice(-57)
                : interimTranscript;
        } else if (voiceIndicatorText && !interimTranscript) {
            voiceIndicatorText.textContent = 'Listening... Speak now';
        }
    };

    recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        let msg = 'Voice input error';
        switch (event.error) {
            case 'no-speech':
                msg = 'No speech detected. Try again.';
                break;
            case 'audio-capture':
                msg = 'No microphone found. Check your device.';
                break;
            case 'not-allowed':
                msg = 'Microphone access denied. Allow it in browser settings.';
                break;
            case 'network':
                if (window.location.protocol === 'file:') {
                    msg = 'Voice input requires a web server (localhost). It does not work on local files.';
                } else {
                    msg = 'Network error during voice recognition (Note: Some browsers like Brave may block this).';
                }
                break;
            case 'aborted':
                // User stopped — no toast needed
                stopVoiceRecording();
                return;
        }
        showToast(msg, 'error');
        stopVoiceRecording();
    };

    recognition.onend = () => {
        // Auto-stop UI if recognition ends on its own
        stopVoiceRecording();
    };
} else {
    // Browser doesn't support Speech Recognition
    if (voiceInputBtn) {
        voiceInputBtn.classList.add('unsupported');
        voiceInputBtn.title = 'Voice input is not supported in this browser';
        voiceInputBtn.disabled = true;
    }
}

function startVoiceRecording() {
    if (!recognition) {
        showToast('Voice input not supported in this browser. Try Chrome or Edge.');
        return;
    }
    try {
        recognition.start();
    } catch (e) {
        // Already started — ignore
    }
}

function stopVoiceRecording() {
    isRecording = false;
    voiceInputBtn.classList.remove('recording');
    if (voiceIndicator) voiceIndicator.style.display = 'none';
    if (recognition) {
        try { recognition.stop(); } catch (e) { /* ignore */ }
    }
    updateCharCount();
}

function toggleVoiceRecording() {
    if (isRecording) {
        stopVoiceRecording();
        showToast('Voice recording stopped');
    } else {
        startVoiceRecording();
    }
}

if (voiceInputBtn && !voiceInputBtn.disabled) {
    voiceInputBtn.addEventListener('click', toggleVoiceRecording);
}

// Contact form
contactForm.addEventListener('submit', handleContactSubmit);

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        closeMobileMenu();
    }
});

// Handle smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (!targetId || targetId === '#') return;

        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const navbarHeight = navbar.offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            setActiveNavLink(targetId);
        }
    });
});

// ========================================
// Keyboard Accessibility
// ========================================

// Handle Enter key for buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btn.click();
        }
    });
});
