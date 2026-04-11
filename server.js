/**
 * PromptForge AI - Backend Server
 * Express.js server with Groq API, MongoDB Auth & History
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'promptforge-secret-key-change-me';

// ========================================
// MongoDB Connection
// ========================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('   ✅ Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('   ❌ MongoDB connection error:', err.message);
        console.error('   Make sure MONGODB_URI is set in .env');
    });

// ========================================
// Mongoose Models
// ========================================

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// History Schema
const historySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalPrompt: { type: String, required: true },
    enhancedPrompt: { type: String, required: true },
    tone: { type: String, default: 'professional' },
    createdAt: { type: Date, default: Date.now }
});

const History = mongoose.model('History', historySchema);

// ========================================
// Middleware
// ========================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? (process.env.CORS_ORIGIN || '*') 
        : '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        error: 'Too many requests. Please wait a minute before trying again.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api', apiLimiter);

// ========================================
// Auth Middleware
// ========================================
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ========================================
// Auth Routes
// ========================================

/** POST /api/auth/signup */
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Signup error:', error.message);
        res.status(500).json({ error: 'Signup failed' });
    }
});

/** POST /api/auth/login */
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ error: 'Login failed' });
    }
});

/** DELETE /api/auth/account */
app.delete('/api/auth/account', authMiddleware, async (req, res) => {
    try {
        const password = String(req.body?.password || '');
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'Account not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        await History.deleteMany({ userId: req.userId });
        await User.deleteOne({ _id: req.userId });

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Account delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// ========================================
// API Routes
// ========================================

/** Health check */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/** Enhance prompt - saves to history if user is authenticated */
app.post('/api/enhance', async (req, res) => {
    try {
        const { prompt, tone = 'professional' } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Please provide a valid prompt' });
        }
        if (prompt.length > 5000) {
            return res.status(400).json({ error: 'Prompt is too long. Maximum 5000 characters.' });
        }
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: API key not set' });
        }

        const systemMessage = buildSystemMessage(tone);
        const enhancedPrompt = await callGroqAPI(prompt, systemMessage);

        // Save to history if user is authenticated
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.userId;
            } catch (e) { /* ignore - unauthenticated use is fine */ }
        }

        if (userId) {
            await History.create({
                userId,
                originalPrompt: prompt,
                enhancedPrompt,
                tone
            });
        }

        res.json({
            success: true,
            enhancedPrompt,
            tone,
            originalLength: prompt.length,
            enhancedLength: enhancedPrompt.length
        });

    } catch (error) {
        console.error('Enhancement error:', error.message);
        if (error.message.includes('quota')) {
            return res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
        }
        res.status(500).json({ error: error.message || 'Failed to enhance prompt' });
    }
});

/** Get available tones */
app.get('/api/tones', (req, res) => {
    res.json({
        tones: [
            { id: 'professional', name: 'Professional', description: 'Clear and business-appropriate' },
            { id: 'creative', name: 'Creative', description: 'Imaginative and engaging' },
            { id: 'technical', name: 'Technical', description: 'Detailed and precise' },
            { id: 'casual', name: 'Casual', description: 'Conversational and friendly' },
            { id: 'academic', name: 'Academic', description: 'Scholarly and research-oriented' }
        ]
    });
});

// ========================================
// History Routes (require auth)
// ========================================

/** GET /api/history - Get user's prompt history */
app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        const history = await History.find({ userId: req.userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, history });
    } catch (error) {
        console.error('History fetch error:', error.message);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/** DELETE /api/history/:id - Delete a single history entry */
app.delete('/api/history/:id', authMiddleware, async (req, res) => {
    try {
        const entry = await History.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!entry) {
            return res.status(404).json({ error: 'History entry not found' });
        }
        res.json({ success: true, message: 'Deleted' });
    } catch (error) {
        console.error('History delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete history entry' });
    }
});

/** DELETE /api/history - Delete all history for user */
app.delete('/api/history', authMiddleware, async (req, res) => {
    try {
        await History.deleteMany({ userId: req.userId });
        res.json({ success: true, message: 'All history deleted' });
    } catch (error) {
        console.error('History clear error:', error.message);
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

// ========================================
// Helper Functions
// ========================================

/**
 * Build system message based on tone
 * @param {string} tone - Selected tone
 * @returns {string} System message
 */
function buildSystemMessage(tone) {
    const baseMessage = "You are an expert prompt engineer. Your task is to improve and structure the user's input prompt to get better results from AI models.";
    
    const toneInstructions = {
        professional: "Make the prompt professional, clear, and business-appropriate. Use formal language and precise terminology.",
        creative: "Make the prompt creative, imaginative, and engaging. Encourage innovative and unique responses.",
        technical: "Make the prompt technical, detailed, and precise. Include specific technical requirements and constraints.",
        casual: "Make the prompt conversational and friendly. Use relaxed language while maintaining clarity.",
        academic: "Make the prompt scholarly and research-oriented. Include proper structure and academic terminology."
    };
    
    return `${baseMessage} ${toneInstructions[tone] || toneInstructions.professional}
    
Guidelines for enhancement:
1. Add clear context and background
2. Specify the desired output format
3. Include any constraints or requirements
4. Break complex requests into steps if needed
5. Add examples if helpful

Return only the enhanced prompt, without any explanations or meta-commentary.`;
}

/**
 * Call Groq API
 * @param {string} prompt - User's prompt
 * @param {string} systemMessage - System instructions
 * @returns {Promise<string>} Enhanced prompt
 */
async function callGroqAPI(prompt, systemMessage) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1024,
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response from API');
    }

    return data.choices[0].message.content;
}

// ========================================
// Serve Frontend
// ========================================

// Serve history page
app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

// Serve privacy policy page
app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'privacy-policy.html'));
});

// Serve terms of service page
app.get('/terms-of-service', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'terms-of-service.html'));
});

// Serve help and support page
app.get('/help-and-support', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'help-and-support.html'));
});

// Serve FAQ page
app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'faq.html'));
});

// ========================================
// Error Handling
// ========================================

// API 404 handler — must come before the SPA catch-all
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ========================================
// Start Server
// ========================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║   🚀 PromptForge AI Server                    ║
║                                               ║
║   Local:   http://localhost:${PORT}              ║
║   Status:  Running                            ║
║   Mode:    ${process.env.NODE_ENV || 'development'}                       ║
║                                               ║
╚═══════════════════════════════════════════════╝
    `);
});

module.exports = app;
