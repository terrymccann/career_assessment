'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import AnalysisVisualization from './AnalysisVisualization';

const CareerAssessmentCollector = () => {
  // State management
  const [phase, setPhase] = useState('initial'); // 'initial' | 'followup' | 'complete'
  const [responses, setResponses] = useState({});
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [followUpResponses, setFollowUpResponses] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryAverages, setCategoryAverages] = useState(null);

  // Initial assessment categories (first 25 questions)
  const initialCategories = [
    {
      title: "Work Style & Environment",
      questions: {
        1: "I prefer working independently rather than as part of a team.",
        2: "I enjoy solving complex problems that require careful analysis.",
        3: "I thrive in fast-paced environments with frequent deadlines.",
        4: "I'm comfortable with routine and predictable work tasks.",
        5: "I prefer roles where I can be creative and innovative."
      }
    },
    {
      title: "Skills & Abilities",
      questions: {
        6: "I excel at explaining complex ideas to others in simple terms.",
        7: "I notice small details that others might overlook.",
        8: "I'm good at persuading others and negotiating.",
        9: "I enjoy learning new technologies and technical skills.",
        10: "I'm skilled at organizing people and managing projects."
      }
    },
    {
      title: "Values & Motivations",
      questions: {
        11: "Making a positive impact on society is important to me.",
        12: "I value job security more than rapid advancement.",
        13: "Having a flexible work schedule is essential for my well-being.",
        14: "I'm willing to take career risks for potentially higher rewards.",
        15: "Recognition and status in my career are important to me."
      }
    },
    {
      title: "Technical & Analytical Skills",
      questions: {
        16: "I enjoy working with data and analyzing information.",
        17: "I'm interested in understanding technical systems.",
        18: "I like solving technical or mechanical problems.",
        19: "I'm comfortable learning new software and technologies.",
        20: "I enjoy coding or programming."
      }
    },
    {
      title: "Learning & Growth",
      questions: {
        21: "I enjoy reading and researching new topics.",
        22: "I learn best through hands-on experience.",
        23: "I seek out opportunities for professional development.",
        24: "I'm comfortable with rapid technological change.",
        25: "I enjoy mentoring and teaching others."
      }
    }
  ];

  const handleInitialResponse = (questionNumber, value) => {
    setResponses(prev => ({
      ...prev,
      [questionNumber]: parseInt(value)
    }));
  };

  const handleFollowUpResponse = (questionIndex, optionIndex) => {
    setFollowUpResponses(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const analyzeInitialResponses = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase: 'initial',
          responses: responses
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze responses');
      }

      setFollowUpQuestions(data.analysis.follow_up_questions);
      setCategoryAverages(data.categoryAverages);
      setAnalysis(data.analysis.initial_analysis);
      setPhase('followup');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFinalResponses = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phase: 'followup',
          responses: followUpResponses,
          previousAnalysis: analysis
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze responses');
      }

      setAnalysis(data.analysis);
      setPhase('complete');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInitialQuestions = () => (
    <div className="space-y-8">
      {initialCategories.map(category => (
        <div key={category.title} className="space-y-4">
          <h3 className="text-lg font-bold">{category.title}</h3>
          <div className="space-y-4">
            {Object.entries(category.questions).map(([number, question]) => (
              <div key={number} className="flex flex-col space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="w-8 text-sm font-medium">Q{number}:</span>
                  <span className="flex-grow">{question}</span>
                </div>
                <div className="flex items-center space-x-2 ml-8">
                  <select 
                    className="border rounded p-2 w-64"
                    onChange={(e) => handleInitialResponse(number, e.target.value)}
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
    </div>
  );

  const renderFollowUpQuestions = () => (
    <div className="space-y-8">
      {followUpQuestions.map((q, qIndex) => (
        <div key={qIndex} className="space-y-4">
          <h3 className="text-lg font-semibold">{q.category}</h3>
          <div className="pl-4">
            <p className="mb-4">{q.question}</p>
            <div className="space-y-4">
              {q.options.map((option, optIndex) => (
                <div 
                  key={optIndex}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    followUpResponses[qIndex] === optIndex
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-accent'
                  }`}
                  onClick={() => handleFollowUpResponse(qIndex, optIndex)}
                >
                  <p className="font-medium mb-2">{option.text}</p>
                  <p className="text-sm text-muted-foreground">{option.context}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {phase === 'initial' && 'Initial Career Assessment'}
            {phase === 'followup' && 'Follow-up Questions'}
            {phase === 'complete' && 'Assessment Complete'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {phase === 'initial' && (
            <form onSubmit={analyzeInitialResponses}>
              {renderInitialQuestions()}
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={loading || Object.keys(responses).length < 25}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Responses...
                  </>
                ) : (
                  'Continue to Follow-up Questions'
                )}
              </Button>
            </form>
          )}

          {phase === 'followup' && (
            <>
              {renderFollowUpQuestions()}
              <Button
                onClick={analyzeFinalResponses}
                className="w-full mt-6"
                disabled={loading || Object.keys(followUpResponses).length < followUpQuestions.length}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Final Analysis...
                  </>
                ) : (
                  'Complete Assessment'
                )}
              </Button>
            </>
          )}

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {(phase === 'followup' || phase === 'complete') && analysis && (
        <AnalysisVisualization 
          analysisData={analysis}
          categoryAverages={categoryAverages}
        />
      )}
    </div>
  );
};

export default CareerAssessmentCollector;