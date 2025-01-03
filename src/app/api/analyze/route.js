import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Redis from 'ioredis';

// Initialize Redis client with default local settings
const redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 50, 2000);
    },
    lazyConnect: true
});

// Cache configuration
const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds
const CACHE_PREFIX = 'embedding:';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Helper function to convert string to hash using Web Crypto API
async function stringToHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper function to generate a cache key
async function generateCacheKey(text) {
    const hash = await stringToHash(text);
    return `${CACHE_PREFIX}${hash}`;
}

// Helper function to calculate category averages
const calculateCategoryAverages = (responses) => {
    const averages = {};
    Object.entries(responses).forEach(([category, questions]) => {
        const values = Object.values(questions)
            .map(q => q.response)
            .filter(r => r !== null && r !== undefined);
        averages[category] = values.length > 0 
            ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
            : null;
    });
    return averages;
};

// Helper function to identify strong categories
const identifyStrongCategories = (averages) => {
    return Object.entries(averages)
        .filter(([_, score]) => parseFloat(score) >= 4.0)
        .map(([category]) => category);
};

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
}

// Batch process embeddings to reduce API calls
async function batchGetEmbeddings(texts) {
    // Deduplicate texts
    const uniqueTexts = [...new Set(texts)];
    
    // Try to get all embeddings from cache first
    const results = new Map();
    const missedTexts = [];
    
    await Promise.all(
        uniqueTexts.map(async (text) => {
            const cacheKey = await generateCacheKey(text);
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    results.set(text, JSON.parse(cached));
                } else {
                    missedTexts.push(text);
                }
            } catch (error) {
                console.warn('Cache get error:', error);
                missedTexts.push(text);
            }
        })
    );
    
    // If we have cache misses, batch them in groups of 100 (OpenAI limit)
    if (missedTexts.length > 0) {
        for (let i = 0; i < missedTexts.length; i += 100) {
            const batch = missedTexts.slice(i, i + 100);
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batch
            });
            
            // Store results and cache them
            batch.forEach(async (text, index) => {
                const embedding = response.data[index].embedding;
                results.set(text, embedding);
                
                // Cache the new embedding
                const cacheKey = await generateCacheKey(text);
                try {
                    await redis.setex(
                        cacheKey,
                        CACHE_TTL,
                        JSON.stringify(embedding)
                    );
                } catch (error) {
                    console.warn('Cache set error:', error);
                }
            });
        }
    }
    
    // Return embeddings in the same order as input texts
    return texts.map(text => results.get(text));
}

// Check for similar questions/options using cosine similarity
async function checkSimilarity(questions) {
    const similarPairs = [];
    const embeddings = new Map();
    
    // Prepare all texts for batch processing
    const textsToProcess = [];
    const keyMappings = new Map();
    
    questions.forEach(q => {
        const questionKey = `Q:${q.question}`;
        textsToProcess.push(q.question);
        keyMappings.set(q.question, questionKey);
        
        q.options.forEach(opt => {
            const optionKey = `O:${q.question}:${opt.text}`;
            textsToProcess.push(opt.text);
            keyMappings.set(opt.text, optionKey);
        });
    });
    
    // Batch process all embeddings
    const processedEmbeddings = await batchGetEmbeddings(textsToProcess);
    
    // Map results back to their keys
    textsToProcess.forEach((text, index) => {
        embeddings.set(keyMappings.get(text), processedEmbeddings[index]);
    });

    // Compare questions with each other
    for (let i = 0; i < questions.length; i++) {
        for (let j = i + 1; j < questions.length; j++) {
            const similarity = cosineSimilarity(
                embeddings.get(`Q:${questions[i].question}`),
                embeddings.get(`Q:${questions[j].question}`)
            );
            if (similarity > 0.85) {
                similarPairs.push({
                    type: 'questions',
                    text1: questions[i].question,
                    text2: questions[j].question,
                    similarity
                });
            }
        }

        // Compare options within each question
        const options = questions[i].options;
        for (let k = 0; k < options.length; k++) {
            for (let l = k + 1; l < options.length; l++) {
                const similarity = cosineSimilarity(
                    embeddings.get(`O:${questions[i].question}:${options[k].text}`),
                    embeddings.get(`O:${questions[i].question}:${options[l].text}`)
                );
                if (similarity > 0.80) {
                    similarPairs.push({
                        type: 'options',
                        question: questions[i].question,
                        text1: options[k].text,
                        text2: options[l].text,
                        similarity
                    });
                }
            }
        }
    }

    return similarPairs;
}

export async function POST(req) {
    try {
        const data = await req.json();
        const { phase = 'initial', responses, previousAnalysis = null } = data;

        if (phase === 'initial') {
            const categoryAverages = calculateCategoryAverages(responses);
            const strongCategories = identifyStrongCategories(categoryAverages);

            const initialPrompt = `As an expert career counselor, analyze these initial assessment responses and generate targeted follow-up questions. The assessment measures various dimensions including work style, skills, values, and preferences.

Initial Assessment Data:
${JSON.stringify(responses, null, 2)}

Strong Categories Identified:
${JSON.stringify(strongCategories, null, 2)}

Provide analysis and follow-up questions in this exact JSON format:

{
    "initial_analysis": {
        "strong_areas": [
            "List 3-4 key strengths identified from the assessment"
        ],
        "potential_directions": [
            "List 2-3 broad career directions based on initial responses"
        ]
    },
    "follow_up_questions": [
        {
            "category": "Category name",
            "question": "The follow-up question",
            "options": [
                {
                    "text": "Option text",
                    "context": "Specific example or scenario",
                    "type": "The aspect this option measures"
                }
            ],
            "reasoning": "Why this question is relevant based on initial responses"
        }
    ]
}

Requirements for follow-up questions:
1. Generate 2 questions for each strong category (${strongCategories.join(', ')})
2. Each question should have 4 distinct options
3. Options must be mutually exclusive and clearly differentiated
4. Include specific examples or contexts for each option
5. Questions should dig deeper into areas where the user showed strong preferences`;

            try {
                const completion = await openai.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert career counselor specializing in analyzing assessment data and providing targeted follow-up questions. Focus on generating distinct, non-overlapping options with clear examples."
                        },
                        {
                            role: "user",
                            content: initialPrompt
                        }
                    ],
                    model: "gpt-4o-mini",
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 2000
                });

                const analysis = JSON.parse(completion.choices[0].message.content);
                
                // Check for similar questions/options
                const similarItems = await checkSimilarity(analysis.follow_up_questions);

                // If similar items found, regenerate with more explicit differentiation
                if (similarItems.length > 0) {
                    const differentiationPrompt = `Please regenerate the follow-up questions. The following items were too similar:
                    ${JSON.stringify(similarItems, null, 2)}
                    
                    Ensure each question and option is clearly differentiated and focuses on distinct aspects.`;

                    const regeneratedCompletion = await openai.chat.completions.create({
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert career counselor. Focus on generating clearly differentiated questions and options."
                            },
                            {
                                role: "user",
                                content: initialPrompt
                            },
                            {
                                role: "assistant",
                                content: completion.choices[0].message.content
                            },
                            {
                                role: "user",
                                content: differentiationPrompt
                            }
                        ],
                        model: "gpt-4o-mini",
                        response_format: { type: "json_object" },
                        temperature: 0.7,
                        max_tokens: 2000
                    });

                    analysis = JSON.parse(regeneratedCompletion.choices[0].message.content);
                }

                return NextResponse.json({
                    phase: 'followup',
                    analysis: analysis,
                    categoryAverages,
                    strongCategories,
                    similarityChecks: similarItems
                });

            } catch (openaiError) {
                console.error('OpenAI API error:', openaiError);
                return NextResponse.json(
                    { error: 'OpenAI API error: ' + openaiError.message },
                    { status: 500 }
                );
            }
        } else if (phase === 'followup') {
            // Handle final analysis with both initial and follow-up responses
            const finalPrompt = `As an expert career counselor, provide a comprehensive career analysis based on both initial and follow-up responses. Consider how the detailed follow-up answers refine or adjust the initial assessment.

Initial Assessment:
${JSON.stringify(previousAnalysis, null, 2)}

Follow-up Responses:
${JSON.stringify(responses, null, 2)}

Provide a final analysis in this exact JSON format:

{
    "Core Strengths": [
        "List 4-5 key strengths supported by both assessment phases"
    ],
    "Primary Career Paths": {
        "careers": [
            {
                "title": "Specific job title",
                "company_type": "Type of company",
                "match_score": 0,
                "salary_range": {
                    "min": 0,
                    "max": 0
                },
                "growth_potential": 0,
                "reasoning": "Explanation of why this career matches the assessment results"
            }
        ]
    },
    "Work Environment": [
        "List 4-5 specific characteristics of ideal work environment"
    ],
    "Development Plan": [
        "List 4-5 specific action items for professional development"
    ],
    "Action Items": [
        "30 Days: Specific immediate actions",
        "90 Days: Medium-term goals",
        "6 Months: Strategic objectives",
        "12 Months: Long-term career milestones"
    ]
}`;

            try {
                const completion = await openai.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert career counselor providing final career recommendations. Focus on specific, actionable insights that combine both assessment phases."
                        },
                        {
                            role: "user",
                            content: finalPrompt
                        }
                    ],
                    model: "gpt-4o-mini",
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 2000
                });

                const finalAnalysis = JSON.parse(completion.choices[0].message.content);
                
                return NextResponse.json({
                    phase: 'complete',
                    analysis: finalAnalysis
                });

            } catch (openaiError) {
                console.error('OpenAI API error:', openaiError);
                return NextResponse.json(
                    { error: 'OpenAI API error: ' + openaiError.message },
                    { status: 500 }
                );
            }
        }

    } catch (error) {
        console.error('General API error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze responses: ' + error.message },
            { status: 500 }
        );
    }
}