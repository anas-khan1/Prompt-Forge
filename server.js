/**
 * PromptForge AI - Backend Server
 * Express.js server with Gemini API integration
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// Middleware
// ========================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://yourdomain.com' 
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Parse JSON bodies
app.use(express.json({ limit: '10kb' }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting - 30 requests per minute per IP
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: {
        error: 'Too many requests. Please wait a minute before trying again.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// ========================================
// API Routes
// ========================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Enhance prompt endpoint
 * POST /api/enhance
 * Body: { prompt: string, tone: string }
 */
app.post('/api/enhance', async (req, res) => {
    try {
        const { prompt, tone = 'professional' } = req.body;

        // Validate input
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                error: 'Please provide a valid prompt'
            });
        }

        if (prompt.length > 5000) {
            return res.status(400).json({
                error: 'Prompt is too long. Maximum 5000 characters.'
            });
        }

        // Check API key
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: API key not set'
            });
        }

        // Build the system message
        const systemMessage = buildSystemMessage(tone);

        // Call Groq API
        const enhancedPrompt = await callGroqAPI(prompt, systemMessage);

        res.json({
            success: true,
            enhancedPrompt,
            tone,
            originalLength: prompt.length,
            enhancedLength: enhancedPrompt.length
        });

    } catch (error) {
        console.error('Enhancement error:', error.message);
        
        // Handle specific API errors
        if (error.message.includes('quota')) {
            return res.status(429).json({
                error: 'API quota exceeded. Please try again later.'
            });
        }

        res.status(500).json({
            error: error.message || 'Failed to enhance prompt'
        });
    }
});

/**
 * Get available tones
 * GET /api/tones
 */
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
 * Call Gemini API
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

// Serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
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
