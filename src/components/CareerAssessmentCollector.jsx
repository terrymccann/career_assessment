'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import AnalysisVisualization from './AnalysisVisualization'
import testData from '../data/answers.json';

const CareerAssessmentCollector = () => {
  const [responses, setResponses] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Define all assessment categories and questions
  const categories = [
    {
        title: "Work Style & Environment",
        questions: {
            1: "I prefer working independently rather than as part of a team.",
            2: "I enjoy solving complex problems that require careful analysis.",
            3: "I thrive in fast-paced environments with frequent deadlines.",
            4: "I'm comfortable with routine and predictable work tasks.",
            5: "I prefer roles where I can be creative and innovative.",
            6: "I work best in a quiet, focused environment.",
            7: "I enjoy multitasking and handling various projects simultaneously.",
            8: "I prefer structured work environments with clear rules and procedures.",
            9: "I'm comfortable with ambiguity and uncertainty in my work.",
            10: "I enjoy working outdoors or in different locations.",
            11: "I prefer having a regular, fixed schedule.",
            12: "I can maintain focus on detailed tasks for long periods.",
            13: "I adapt quickly to new work situations and changes.",
            14: "I enjoy competitive work environments.",
            15: "I prefer collaborative decision-making processes."
        }
    },
    {
        title: "Skills & Abilities",
        questions: {
            16: "I excel at explaining complex ideas to others in simple terms.",
            17: "I notice small details that others might overlook.",
            18: "I'm good at persuading others and negotiating.",
            19: "I enjoy learning new technologies and technical skills.",
            20: "I'm skilled at organizing people and managing projects.",
            21: "I can quickly identify patterns and connections in information.",
            22: "I'm good at mathematical and numerical analysis.",
            23: "I have strong written communication skills.",
            24: "I'm skilled at resolving conflicts between people.",
            25: "I excel at visual thinking and spatial reasoning.",
            26: "I'm good at developing and implementing systems.",
            27: "I can effectively manage multiple priorities.",
            28: "I have strong public speaking abilities.",
            29: "I'm skilled at gathering and analyzing data.",
            30: "I excel at creative problem-solving."
        }
    },
    {
        title: "Values & Motivations",
        questions: {
            31: "Making a positive impact on society is more important than earning a high salary.",
            32: "I value job security more than the potential for rapid career advancement.",
            33: "Having a flexible work schedule is essential for my well-being.",
            34: "I'm willing to take career risks for potentially higher rewards.",
            35: "Recognition and status in my career are important to me.",
            36: "Work-life balance is a top priority for me.",
            37: "I'm motivated by opportunities for continuous learning.",
            38: "Financial stability is more important than job satisfaction.",
            39: "I value autonomy and independence in my work.",
            40: "I'm motivated by helping others succeed.",
            41: "I prefer working for established organizations over startups.",
            42: "Career advancement opportunities are crucial to me.",
            43: "I value diversity and inclusion in the workplace.",
            44: "I'm motivated by solving challenging problems.",
            45: "Environmental sustainability is important in my career choices."
        }
    },
    {
        title: "Interpersonal Dynamics",
        questions: {
            46: "I enjoy meeting and interacting with new people regularly.",
            47: "I prefer written communication over verbal communication.",
            48: "I'm comfortable taking on leadership roles.",
            49: "I enjoy teaching or mentoring others.",
            50: "I work well under direct supervision and clear guidelines.",
            51: "I'm good at building and maintaining professional relationships.",
            52: "I prefer working alone on complex tasks.",
            53: "I'm comfortable giving presentations to large groups.",
            54: "I enjoy networking and building professional connections.",
            55: "I work well in team-based environments.",
            56: "I'm skilled at managing difficult personalities.",
            57: "I prefer direct communication styles.",
            58: "I'm good at reading people's emotions and motivations.",
            59: "I enjoy roles that involve customer interaction.",
            60: "I'm comfortable with constructive criticism."
        }
    },
    {
        title: "Technical & Analytical Skills",
        questions: {
            61: "I enjoy working with data and analyzing information.",
            62: "I'm interested in understanding human behavior and psychology.",
            63: "I like working with my hands and creating tangible things.",
            64: "I'm drawn to artistic and creative pursuits.",
            65: "I enjoy solving technical or mechanical problems.",
            66: "I'm comfortable learning new software and technologies.",
            67: "I enjoy coding or programming.",
            68: "I'm good at troubleshooting technical issues.",
            69: "I enjoy statistical analysis and interpretation.",
            70: "I'm skilled at design and visual composition.",
            71: "I enjoy research and investigation.",
            72: "I'm good at process improvement and optimization.",
            73: "I enjoy working with scientific concepts.",
            74: "I'm skilled at financial analysis and planning.",
            75: "I enjoy working with complex systems."
        }
    },
    {
        title: "Industry & Field Preferences",
        questions: {
            76: "I'm interested in healthcare and medical fields.",
            77: "I enjoy working in educational settings.",
            78: "I'm drawn to business and entrepreneurship.",
            79: "I'm interested in environmental and sustainability work.",
            80: "I enjoy working in creative industries.",
            81: "I'm interested in law and legal processes.",
            82: "I enjoy working with technology and software.",
            83: "I'm drawn to social services and community work.",
            84: "I enjoy working in financial services.",
            85: "I'm interested in scientific research.",
            86: "I enjoy working in marketing and advertising.",
            87: "I'm drawn to construction and building industries.",
            88: "I enjoy working in hospitality and service industries.",
            89: "I'm interested in government and public service.",
            90: "I enjoy working in media and entertainment."
        }
    },
    {
        title: "Learning & Growth",
        questions: {
            91: "I enjoy reading and researching new topics.",
            92: "I learn best through hands-on experience.",
            93: "I seek out opportunities for professional development.",
            94: "I'm comfortable with rapid technological change.",
            95: "I enjoy mentoring and teaching others.",
            96: "I adapt quickly to new methods and procedures.",
            97: "I'm interested in pursuing additional education or certifications.",
            98: "I learn well from constructive feedback.",
            99: "I enjoy challenging myself with new skills.",
            100: "I'm committed to continuous self-improvement."
        }
    }
  ];

  const handleResponse = (questionNumber, value) => {
    setResponses(prev => ({
        ...prev,
        [questionNumber]: parseInt(value)
    }));
  };

  const prepareDataForAnalysis = () => {
    const formattedData = {
        metadata: {
            timestamp: new Date().toISOString(),
            completionRate: `${Math.round((Object.keys(responses).length / 100) * 100)}%`
        },
        responses: {},
        categoryAverages: {}
    };

    // Check if responses is already categorized (test data format)
    const isTestData = typeof Object.values(responses)[0] === 'object' && 
                      Object.values(responses)[0].hasOwnProperty('1');

    if (isTestData) {
        // Handle test data format (already categorized)
        formattedData.responses = responses;
        
        // Calculate averages for test data
        Object.entries(responses).forEach(([category, questionResponses]) => {
            const validResponses = Object.values(questionResponses)
                .filter(item => item?.response !== undefined && item?.response !== null);
            
            if (validResponses.length > 0) {
                const sum = validResponses.reduce((acc, curr) => acc + curr.response, 0);
                formattedData.categoryAverages[category] = (sum / validResponses.length).toFixed(2);
            } else {
                formattedData.categoryAverages[category] = "0.00";
            }
        });
    } else {
        // Handle form submission format (flat responses)
        categories.forEach(category => {
            const categoryResponses = {};
            let categorySum = 0;
            let categoryCount = 0;

            Object.entries(category.questions).forEach(([number, question]) => {
                const response = responses[number];
                categoryResponses[number] = {
                    question,
                    response: response || null
                };
                if (response) {
                    categorySum += response;
                    categoryCount++;
                }
            });

            formattedData.responses[category.title] = categoryResponses;
            formattedData.categoryAverages[category.title] = categoryCount ? 
                (categorySum / categoryCount).toFixed(2) : null;
        });
    }

    return formattedData;
  };

  const loadTestData = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
        // Load the test responses
        setResponses(testData);
        
        // Prepare and send the data for analysis
        const data = prepareDataForAnalysis();
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();
        
        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to analyze responses');
        }

        setAnalysis(responseData);
    } catch (err) {
        console.error('Analysis error:', err);
        setError(err.message);
        setDebugInfo({
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    } finally {
        setLoading(false);
    }
  };

  const analyzeResponses = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
        const data = prepareDataForAnalysis();
        console.log('Sending data:', data);

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();
        console.log('Response received:', responseData);

        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to analyze responses');
        }

        setAnalysis(responseData);
    } catch (err) {
        console.error('Analysis error:', err);
        setError(err.message);
        setDebugInfo({
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString()
        });
    } finally {
        setLoading(false);
    }
  };

  const renderDebugInfo = () => {
    if (!debugInfo) return null;
    
    return (
        <Card className="mt-4 bg-red-50">
            <CardHeader>
                <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
                <pre className="whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex justify-end space-x-4 mb-4">
            <Button
                onClick={loadTestData}
                variant="secondary"
                disabled={loading}
            >
                Load Test Data
            </Button>
        </div>

        <form onSubmit={analyzeResponses}>
            <Card>
                <CardHeader>
                    <CardTitle>Career Assessment Questionnaire</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {categories.map(category => (
                            <div key={category.title} className="space-y-4">
                                <h3 className="text-lg font-bold">{category.title}</h3>
                                <div className="space-y-4">
                                    {Object.entries(category.questions).map(([number, question]) => (
                                        <div key={number} className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium whitespace-nowrap">Question {number}:</span>
                                            <span>{question}</span>
                                        </div>
                                        <div className="ml-4">
                                            <select 
                                                className="border rounded p-2 w-64 mb-5"
                                                onChange={(e) => handleResponse(number, e.target.value)}
                                                value={responses[number] || ''}
                                            >
                                                <option value="">Select...</option>
                                                <option value="1">1 - Strongly Disagree</option>
                                                <option value="2">2 - Disagree</option>
                                                <option value="3">3 - Neutral</option>
                                                <option value="4">4 - Agree</option>
                                                <option value="5">5 - Strongly Agree</option>
                                            </select>
                                        </div>
                                    </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <Button
                            type="submit"
                            disabled={loading || Object.keys(responses).length === 0}
                            className="w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing Responses...
                                </>
                            ) : (
                                'Analyze Responses'
                            )}
                        </Button>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>
        </form>

        {renderDebugInfo()}
        
        {analysis && (
            <AnalysisVisualization 
                analysisData={analysis} 
                categoryAverages={prepareDataForAnalysis().categoryAverages} 
            />
        )}
    </div>
  );
};

export default CareerAssessmentCollector