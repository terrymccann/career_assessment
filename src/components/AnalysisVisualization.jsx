'use client';

import React from 'react';
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const AnalysisVisualization = ({ analysisData, categoryAverages }) => {
    // Prepare data for radar chart
    const radarData = Object.entries(categoryAverages).map(([category, score]) => ({
        category: category.split(' ')[0], // Take first word for brevity
        score: parseFloat(score)
    }));

    // Prepare data for career matches bar chart
    const careerMatchData = analysisData?.["Primary Career Paths"]?.careers || [];

    // Prepare the career data for visualization
    const formattedCareerData = careerMatchData.map(career => ({
        career: `${career.title}`,  // Can add company_type if desired
        matchScore: career.match_score,
        salaryMin: career.salary_range?.min,
        salaryMax: career.salary_range?.max,
        growth: career.growth_potential
    }));

    const renderAnalysisSection = (section, content) => {
        if (section === "Primary Career Paths") {
            // Handle the special case of Primary Career Paths
            return content.careers.map((career, index) => (
                <p key={index}>
                    {career.title} at {career.company_type} ({career.match_score}% match) - 
                    Salary Range: ${career.salary_range.min.toLocaleString()} - ${career.salary_range.max.toLocaleString()}, 
                    Growth Potential: {career.growth_potential}%
                </p>
            ));
        }
        // Handle other sections normally
        return Array.isArray(content) ? content.map((item, i) => (
            <p key={i}>{item}</p>
        )) : <p>{content}</p>;
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Category Strength Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer>
                            <RadarChart data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="category" />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                <Radar
                                    name="Skills Profile"
                                    dataKey="score"
                                    stroke="#8884d8"
                                    fill="#8884d8"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Career Match Scores</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={formattedCareerData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="career" angle={-45} textAnchor="end" height={100} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip 
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const career = formattedCareerData.find(c => c.career === label);
                                            return (
                                                <div className="bg-white p-4 rounded shadow-lg border">
                                                    <p className="font-semibold">{label}</p>
                                                    <p>Match Score: {career.matchScore}%</p>
                                                    <p>Salary Range: ${career.salaryMin.toLocaleString()} - ${career.salaryMax.toLocaleString()}</p>
                                                    <p>Growth Potential: {career.growth}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="matchScore"
                                    fill="#82ca9d"
                                    name="Match Score"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {analysisData && Object.entries(analysisData).map(([section, content]) => (
                        <div key={section} className="space-y-2">
                            <h3 className="font-semibold text-lg">{section}</h3>
                            <div className="pl-4 space-y-2">
                                {renderAnalysisSection(section, content)}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Key Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analysisData?.["Development Plan"]?.map((recommendation, index) => (
                            <div
                                key={index}
                                className="p-4 border rounded-lg bg-background hover:bg-accent transition-colors"
                            >
                                <p>{recommendation}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AnalysisVisualization;
