const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.1-8b-instant';
  }

  async generateQuestions(keywords, numQuestions = 10, difficulty = 'medium', resumeText = '') {
    const context = this.buildContext(keywords, resumeText);
    const prompt = this.buildQuestionPrompt(context, numQuestions, difficulty);
    
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: Math.min(numQuestions * 50, 2048)
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const content = response.data.choices[0].message.content;
      return this.parseQuestions(content, numQuestions);
    } catch (error) {
      throw new Error(`AI question generation failed: ${error.message}`);
    }
  }

  async analyzeAnswers(questions, answers) {
    const prompt = this.buildAnalysisPrompt(questions, answers);
    
    try {
      const response = await axios.post(this.baseURL, {
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      const content = response.data.choices[0].message.content;
      return this.parseAnalysis(content);
    } catch (error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  buildContext(keywords, resumeText = '') {
    const sections = [];

    if (resumeText) {
      sections.push(`FULL RESUME:\n${resumeText.substring(0, 3000)}`);
    }
    
    if (keywords.skills && keywords.skills.length > 0) {
      sections.push(`SKILLS:\n${keywords.skills.join(', ')}`);
    }
    
    if (keywords.projects && keywords.projects.length > 0) {
      const projectTexts = keywords.projects.map(p => `- ${p.title}: ${p.description}`);
      sections.push(`PROJECTS:\n${projectTexts.join('\n')}`);
    }
    
    if (keywords.experience && keywords.experience.length > 0) {
      const expTexts = keywords.experience.map(e => `- ${e.title} at ${e.company} (${e.dates})`);
      sections.push(`EXPERIENCE:\n${expTexts.join('\n')}`);
    }
    
    if (keywords.education && keywords.education.length > 0) {
      const eduTexts = keywords.education.map(e => `- ${e.degree} (${e.year})`);
      sections.push(`EDUCATION:\n${eduTexts.join('\n')}`);
    }
    
    return sections.join('\n\n');
  }

  buildQuestionPrompt(context, numQuestions, difficulty) {
    const difficultyInstructions = {
      easy: 'Focus on fundamental concepts, basic understanding, and simple explanations.',
      medium: 'Focus on practical application, problem-solving, and implementation details.',
      hard: 'Focus on advanced concepts, system design, scalability, and architectural decisions.'
    };

    return `You are an expert technical interviewer. Based on the candidate's actual resume below, generate ${numQuestions} ${difficulty}-level interview questions that are SPECIFIC to their projects, skills, and experience — not generic questions.

Resume data:
${context}

${difficultyInstructions[difficulty]}

IMPORTANT: Questions must reference specific technologies, projects, or experiences from the resume above. Do not ask generic questions.

Return ONLY a JSON array of strings, each string being a question. Do not include any other text.
Example: ["Question 1", "Question 2", ...]`;
  }

  buildAnalysisPrompt(questions, answers) {
    const qaText = questions.map((q, i) => {
      const answer = answers[i] || { answerText: 'No answer provided' };
      return `Q${i + 1}: ${q.questionText}\nA${i + 1}: ${answer.answerText}`;
    }).join('\n\n');

    return `You are a STRICT technical interviewer evaluating candidates for a senior software engineering position. Be extremely critical and thorough in your evaluation.

**SCORING CRITERIA (Be Very Strict):**

**TECHNICAL ACCURACY (40 points):**
- Completely correct answer: 35-40 points
- Mostly correct with minor errors: 25-34 points  
- Partially correct with significant gaps: 15-24 points
- Incorrect or misleading information: 0-14 points
- No answer provided: 0 points

**COMPLETENESS & DEPTH (25 points):**
- Comprehensive explanation covering all aspects: 20-25 points
- Good explanation missing some details: 15-19 points
- Basic explanation lacking depth: 10-14 points
- Superficial or incomplete: 5-9 points
- Very incomplete or no explanation: 0-4 points

**PRACTICAL APPLICATION (20 points):**
- Shows real-world understanding with examples: 18-20 points
- Some practical knowledge: 12-17 points
- Limited practical understanding: 6-11 points
- No practical application shown: 0-5 points

**COMMUNICATION CLARITY (15 points):**
- Clear, well-structured, professional: 13-15 points
- Generally clear with minor issues: 10-12 points
- Somewhat unclear or disorganized: 6-9 points
- Poor communication: 0-5 points

**PENALTIES (Deduct points for):**
- Factual errors: -5 to -15 points each
- Outdated information: -3 to -8 points
- Vague or generic answers: -5 to -10 points
- Copy-paste style answers: -10 to -20 points
- Contradictory statements: -8 to -15 points
- Missing key concepts: -5 to -12 points each
- Poor grammar/spelling (if excessive): -2 to -5 points

**ADDITIONAL STRICT REQUIREMENTS:**
- Answers should demonstrate senior-level understanding
- Look for specific examples, not just theory
- Expect mention of edge cases, trade-offs, and best practices
- Penalize heavily for incorrect technical details
- Reward only genuinely insightful responses

**SCORE RANGES:**
- 90-100: Exceptional (rare, only for outstanding answers)
- 80-89: Very Good (solid senior-level responses)
- 70-79: Good (acceptable but with room for improvement)
- 60-69: Below Average (significant gaps or errors)
- 50-59: Poor (major issues, incorrect information)
- 0-49: Unacceptable (completely wrong or no answer)

Analyze each answer individually, then calculate the overall weighted average.

**INTERVIEW Q&A:**
${qaText}

**REQUIRED OUTPUT FORMAT:**
{
  "overallScore": [calculated score 0-100],
  "individualScores": [
    {
      "questionIndex": 1,
      "score": [0-100],
      "technicalAccuracy": [0-40],
      "completeness": [0-25], 
      "practicalApplication": [0-20],
      "communication": [0-15],
      "penalties": [negative points],
      "feedback": "specific feedback for this answer"
    }
  ],
  "strengths": ["specific strengths observed"],
  "criticalIssues": ["major problems found"],
  "improvements": ["specific areas needing improvement"],
  "detailedAnalysis": "comprehensive analysis of performance",
  "recommendations": ["actionable recommendations for improvement"],
  "hiringRecommendation": "HIRE/MAYBE/NO_HIRE with justification"
}

Be ruthlessly honest and specific in your evaluation. Do not inflate scores.`;
  }

  parseQuestions(content, numQuestions) {
    try {
      // Try parsing as JSON array
      if (content.trim().startsWith('[')) {
        const questions = JSON.parse(content);
        return questions.slice(0, numQuestions).map(q => ({ question: q }));
      }
    } catch (e) {
      // Fallback to text parsing
    }

    // Extract questions from text
    const lines = content.split('\n').filter(line => line.trim());
    const questions = [];
    
    for (const line of lines) {
      const cleanLine = line.replace(/^\d+\.?\s*/, '').replace(/^["\-\*]\s*/, '').replace(/["]*$/, '').trim();
      if (cleanLine.length > 10) {
        questions.push(cleanLine);
        if (questions.length >= numQuestions) break;
      }
    }
    
    return questions.map(q => ({ question: q }));
  }

  parseAnalysis(content) {
    try {
      // Try parsing as JSON
      if (content.trim().startsWith('{')) {
        const parsed = JSON.parse(content);
        
        // Ensure we have the required fields
        return {
          overallScore: Math.max(0, Math.min(100, parsed.overallScore || 45)),
          individualScores: parsed.individualScores || [],
          strengths: parsed.strengths || ['Basic understanding shown'],
          criticalIssues: parsed.criticalIssues || ['Multiple areas need improvement'],
          improvements: parsed.improvements || ['More detailed explanations needed', 'Consider edge cases', 'Provide specific examples'],
          detailedAnalysis: parsed.detailedAnalysis || 'Analysis could not be parsed properly.',
          recommendations: parsed.recommendations || ['Study core concepts', 'Practice coding problems', 'Review system design principles'],
          hiringRecommendation: parsed.hiringRecommendation || 'MAYBE - Needs significant improvement'
        };
      }
    } catch (e) {
      console.error('Failed to parse AI analysis:', e.message);
    }

    // Fallback parsing with stricter default scores
    const lines = content.split('\n').filter(line => line.trim());
    let score = 45; // Default to below average
    
    // Try to extract score from text
    for (const line of lines) {
      const scoreMatch = line.match(/score[:\s]*(\d+)/i);
      if (scoreMatch) {
        score = Math.max(0, Math.min(100, parseInt(scoreMatch[1])));
        break;
      }
    }
    
    // Apply additional penalties for common issues
    if (content.toLowerCase().includes('no answer') || content.length < 50) {
      score = Math.max(0, score - 20);
    }
    
    if (content.toLowerCase().includes('incorrect') || content.toLowerCase().includes('wrong')) {
      score = Math.max(0, score - 15);
    }
    
    if (content.toLowerCase().includes('incomplete') || content.toLowerCase().includes('lacking')) {
      score = Math.max(0, score - 10);
    }

    return {
      overallScore: score,
      individualScores: [],
      strengths: ['Some basic knowledge demonstrated'],
      criticalIssues: ['Significant gaps in understanding', 'Lacks depth in explanations'],
      improvements: [
        'Provide more detailed and accurate explanations',
        'Include practical examples and use cases',
        'Address edge cases and potential issues',
        'Demonstrate deeper technical understanding'
      ],
      detailedAnalysis: content || 'The candidate\'s responses show room for improvement in technical depth and accuracy.',
      recommendations: [
        'Review fundamental concepts thoroughly',
        'Practice explaining technical concepts clearly',
        'Study real-world applications and best practices',
        'Work on providing more comprehensive answers'
      ],
      hiringRecommendation: score >= 75 ? 'MAYBE - Shows potential but needs improvement' : 'NO_HIRE - Significant gaps in required skills'
    };
  }
}

module.exports = AIService;