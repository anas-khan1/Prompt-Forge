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
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const contactForm = document.getElementById('contactForm');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

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
function showToast(message, duration = 3000) {
    toastMessage.textContent = message;
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
        // Call backend API
        const response = await fetch(`${CONFIG.apiUrl}/api/enhance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
        showToast(`Error: ${error.message}`);
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
    showToast('Message sent! (Demo - no backend)');
    
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

// Copy button
copyBtn.addEventListener('click', copyToClipboard);

// Clear button
clearBtn.addEventListener('click', clearOutput);

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
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            const navbarHeight = navbar.offsetHeight;
            const targetPosition = targetElement.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
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
