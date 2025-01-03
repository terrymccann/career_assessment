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

const AnalysisVisualization = ({ analysisData, categoryAverages, phase = 'complete' }) => {
    // Prepare data for radar chart showing category strengths
    const radarData = Object.entries(categoryAverages || {}).map(([category, score]) => ({
        category: category.split(' ')[0], // Take first word for brevity
        score: parseFloat(score)
    }));

    // Render interim analysis during the follow-up phase
    const renderInterimAnalysis = () => {
        const { strong_areas, potential_directions } = analysisData;
        
        return (
            <div className="space-y-6">
                {/* Radar Chart for Category Strengths */}
                <Card>
                    <CardHeader>
                        <CardTitle>Initial Strength Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="category" />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                    <Radar
                                        name="Category Strength"
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

                {/* Key Strengths Identified */}
                <Card>
                    <CardHeader>
                        <CardTitle>Key Strengths Identified</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {strong_areas?.map((strength, index) => (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg bg-background hover:bg-accent transition-colors"
                                >
                                    <p>{strength}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Potential Career Directions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Potential Career Directions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {potential_directions?.map((direction, index) => (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg bg-background hover:bg-accent transition-colors"
                                >
                                    <p>{direction}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    // Render final analysis with complete career recommendations
    const renderFinalAnalysis = () => {
        // Prepare data for career matches bar chart
        const careerMatchData = analysisData?.["Primary Career Paths"]?.careers || [];
        const formattedCareerData = careerMatchData.map(career => ({
            career: career.title,
            matchScore: career.match_score,
            salaryMin: career.salary_range?.min,
            salaryMax: career.salary_range?.max,
            growth: career.growth_potential
        }));

        return (
            <div className="space-y-6">
                {/* Category Strength Radar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Final Strength Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer>
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="category" />
                                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                                    <Radar
                                        name="Final Profile"
                                        dataKey="score"
                                        stroke="#82ca9d"
                                        fill="#82ca9d"
                                        fillOpacity={0.6}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Career Match Scores */}
                <Card>
                    <CardHeader>
                        <CardTitle>Career Match Analysis</CardTitle>
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

                {/* Core Strengths */}
                <Card>
                    <CardHeader>
                        <CardTitle>Core Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analysisData?.["Core Strengths"]?.map((strength, index) => (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg bg-background hover:bg-accent transition-colors"
                                >
                                    <p>{strength}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Development Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Development Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analysisData?.["Development Plan"]?.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg bg-background hover:bg-accent transition-colors"
                                >
                                    <p>{item}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Action Items Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle>Action Items Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analysisData?.["Action Items"]?.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 border rounded-lg bg-background hover:bg-accent transition-colors"
                                >
                                    <p>{item}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="mt-8">
            {phase === 'followup' ? renderInterimAnalysis() : renderFinalAnalysis()}
        </div>
    );
};

export default AnalysisVisualization;
