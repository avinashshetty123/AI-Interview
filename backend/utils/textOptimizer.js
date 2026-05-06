const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const normalizeSkillList = (skills = []) => {
  return (Array.isArray(skills) ? skills : [])
    .map(skill => {
      if (typeof skill === 'string') return skill;
      if (skill && typeof skill === 'object') {
        return skill.name || skill.label || skill.title || skill.value || '';
      }
      return '';
    })
    .map(skill => String(skill).trim())
    .filter(Boolean);
};

const sanitizeGeneratedText = (text = '') => {
  return String(text)
    .replace(/\[object Object\]/gi, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

const optimizeText = async (text, type, context = {}) => {
  try {
    if (!text || text.trim().length === 0) {
      return text;
    }

    // Sanitize: strip control characters and cap length to avoid API 400 errors
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').substring(0, 2000);

    const contextSkills = normalizeSkillList(context.skills);

    const prompts = {
      experience: `Optimize this job experience description for ATS compatibility. Make it concise, impactful, and use strong action verbs. Keep it under 150 words and use bullet points format:

Original: "${text}"

Requirements:
- Start with strong action verbs (Led, Developed, Implemented, etc.)
- Include quantifiable achievements where possible
- Use industry-relevant keywords
- Keep each bullet point under 20 words
- Focus on results and impact
- Make it ATS-friendly

Return only the optimized text without explanations.`,

      project: `Optimize this project description for a resume. Make it concise, technical, and ATS-friendly. Keep it under 100 words:

Original: "${text}"

Requirements:
- Highlight technical skills and technologies used
- Focus on key features and achievements
- Use action-oriented language
- Include relevant keywords
- Keep it professional and concise
- Mention impact or results if applicable

Return only the optimized text without explanations.`,

      summary: `Create a professional summary for a resume based on this information. Make it ATS-optimized and compelling. Keep it between 50-120 words:

Original: "${text}"
${contextSkills.length ? `Skills: ${contextSkills.join(', ')}` : ''}
${context.experience ? `Years of experience: ${context.experience}` : ''}
${context.industry ? `Industry: ${context.industry}` : ''}

Requirements:
- Professional and engaging tone
- Include key skills and expertise
- Highlight career achievements
- Use industry keywords
- Make it ATS-friendly
- Focus on value proposition

Return only the optimized summary without explanations.`,

      achievement: `Optimize this achievement/bullet point for a resume. Make it impactful and quantifiable:

Original: "${text}"

Requirements:
- Start with a strong action verb
- Include numbers/percentages if possible
- Keep under 15 words
- Focus on results and impact
- Use professional language

Return only the optimized achievement without explanations.`,

      education: `Optimize this education description for a resume. Keep it concise and relevant:

Original: "${text}"

Requirements:
- Highlight relevant coursework, honors, or achievements
- Keep under 50 words
- Focus on career-relevant information
- Use professional language

Return only the optimized text without explanations.`
    };

    const prompt = prompts[type] || prompts.experience;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer and ATS optimization specialist. Provide concise, professional, and ATS-friendly content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const optimizedText = data.choices[0]?.message?.content?.trim();

    return sanitizeGeneratedText(optimizedText || text);
  } catch (error) {
    console.error('Error optimizing text:', error);
    return text; // Return original text if optimization fails
  }
};

const generateSkillsSuggestions = async (experience, projects, education) => {
  try {
    const prompt = `Based on the following resume information, suggest 10-15 relevant technical and soft skills that would be valuable for this profile:

Experience: ${JSON.stringify(experience)}
Projects: ${JSON.stringify(projects)}
Education: ${JSON.stringify(education)}

Return a JSON object with two arrays:
{
  "technical": ["skill1", "skill2", ...],
  "soft": ["skill1", "skill2", ...]
}

Focus on:
- Skills commonly mentioned in job postings for this profile
- Technologies and tools relevant to their experience
- Industry-standard skills
- ATS-friendly skill names`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor. Provide skill suggestions in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();
    
    try {
      return JSON.parse(content);
    } catch {
      // Fallback skills if JSON parsing fails
      return {
        technical: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS'],
        soft: ['Communication', 'Problem Solving', 'Team Work', 'Leadership', 'Time Management']
      };
    }
  } catch (error) {
    console.error('Error generating skills suggestions:', error);
    return {
      technical: ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS'],
      soft: ['Communication', 'Problem Solving', 'Team Work', 'Leadership', 'Time Management']
    };
  }
};

const generateProfessionalSummary = async (personalInfo, skills, experience, education) => {
  try {
    const experienceYears = experience?.length || 0;
    const skillsList = [
      ...normalizeSkillList(skills?.technical),
      ...normalizeSkillList(skills?.soft)
    ].slice(0, 8).join(', ');

    const prompt = `Generate a professional summary for ${personalInfo?.fullName || 'this candidate'} based on their profile:

Skills: ${skillsList}
Experience Positions: ${experienceYears}
Education: ${education?.[0]?.degree || 'Not specified'}

Create a compelling 2-3 sentence professional summary that:
- Highlights key strengths and expertise
- Mentions years of experience (if applicable)
- Includes relevant keywords
- Shows value proposition
- Is ATS-optimized
- Keeps it between 50-100 words

Return only the summary text without quotes or explanations.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer. Create professional, ATS-optimized summaries. Never output [object Object], raw JSON, placeholders, or object-like values. Use only readable skill names.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return sanitizeGeneratedText(data.choices[0]?.message?.content?.trim() || '');
  } catch (error) {
    console.error('Error generating professional summary:', error);
    return '';
  }
};

module.exports = {
  optimizeText,
  generateSkillsSuggestions,
  generateProfessionalSummary
};
