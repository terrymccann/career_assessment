import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
    try {
        const assessmentData = await req.json();
        
        // Log the incoming data (remove in production)
        console.log('Received assessment data:', JSON.stringify(assessmentData, null, 2));

        const prompt = `As an expert career counselor and professional development specialist, analyze this career assessment data and provide comprehensive guidance. The assessment measures various dimensions including work style, skills, values, and preferences.

Assessment Data:
${JSON.stringify(assessmentData, null, 2)}

Based on this assessment data, provide detailed analysis in this exact JSON format:

{
    "Core Strengths": [
        "List 4-5 key strengths inferred from the assessment",
        "Each strength should be specific and supported by the data"
    ],
    "Primary Career Paths": {
        "careers": [
            {
                "title": "Specific job title", // Replace with specific job title based on assessment
                "company_type": "Type of company", // Replace with appropriate company type
                "match_score": 0, // Replace with calculated score 0-100
                "salary_range": {
                    "min": 0, // Replace with actual minimum salary
                    "max": 0 // Replace with actual maximum salary
                },
                "growth_potential": // Replace with calculated growth potential between 0-100
            }
        ]
    },
    "Work Environment": [
        "List 4-5 key characteristics of ideal work environment",
        "Include team dynamics, management style, workplace culture"
    ],
    "Development Plan": [
        "List 4-5 specific action items for professional development",
        "Include skill gaps to address and learning priorities"
    ],
    "Action Items": [
        "30 Days: Specific immediate actions",
        "90 Days: Medium-term goals",
        "6 Months: Strategic objectives",
        "12 Months: Long-term career milestones"
    ]
}

For the Primary Career Paths, ensure each suggestion is a specific job title that exists in the real world, not a general field. Include match percentage based on how well the role aligns with the assessment responses. The match score should consider all aspects of the assessment including work style, skills, values, and preferences. Provide 6 matches`;

        try {
            // Call OpenAI API
            const completion = await openai.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "You are an expert career counselor specializing in analyzing assessment data and providing actionable career guidance. Focus on specific, real-world job titles and detailed match analysis."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                temperature: 0.7,
                max_tokens: 2000
            });

            const analysis = JSON.parse(completion.choices[0].message.content);
            console.log('Analysis generated:', JSON.stringify(analysis, null, 2));
            return NextResponse.json(analysis);

        } catch (openaiError) {
            console.error('OpenAI API error:', openaiError);
            return NextResponse.json(
                { error: 'OpenAI API error: ' + openaiError.message },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('General API error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze responses: ' + error.message },
            { status: 500 }
        );
    }
}