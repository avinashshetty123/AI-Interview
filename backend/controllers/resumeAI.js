// Add this to resumeController.js

const generateAISummary = async (req, res) => {
  try {
    const { personalInfo, experience, education, skills, projects } = req.body;

    // Create a comprehensive profile for AI analysis
    const profile = {
      name: personalInfo?.fullName || 'Professional',
      experience: experience || [],
      education: education || [],
      technicalSkills: normalizeSkillList(skills?.technical),
      softSkills: normalizeSkillList(skills?.soft),
      projects: projects || []
    };

    // Generate AI summary using Groq or similar service
    const summaryPrompt = `
Create a professional ATS-optimized resume summary for ${profile.name} based on the following information:

Experience: ${profile.experience.map(exp => `${exp.jobTitle || exp.title || 'Role'} at ${exp.company || 'Company'} - ${exp.description || ''}`).join('; ')}
Education: ${profile.education.map(edu => `${edu.degree} from ${edu.institution}`).join('; ')}
Technical Skills: ${profile.technicalSkills.join(', ')}
Soft Skills: ${profile.softSkills.join(', ')}
Projects: ${profile.projects.map(proj => proj.name || proj.title).filter(Boolean).join(', ')}

Requirements:
- 50-150 words
- Include quantifiable achievements where possible
- Use ATS-friendly keywords
- Focus on most relevant experience
- Professional tone
- Action verbs (achieved, developed, managed, etc.)

Generate 3 different summary variations and provide ATS optimization tips.
`;

    // For now, generate a template-based summary
    // In production, you would call an AI service like Groq
    const summaryVariations = generateTemplateSummary(profile);
    
    const suggestions = [
      "Results-driven professional with proven track record in delivering high-impact solutions and driving organizational growth through innovative approaches.",
      "Experienced specialist with strong analytical skills and expertise in cross-functional collaboration to achieve strategic objectives.",
      "Dynamic professional with comprehensive background in technology and business, committed to excellence and continuous improvement."
    ];

    res.json({
      success: true,
      summary: sanitizeSummary(summaryVariations[0]),
      suggestions: summaryVariations,
      tips: [
        "Include specific metrics and achievements",
        "Use industry-relevant keywords",
        "Keep between 50-150 words",
        "Focus on your most recent experience",
        "Highlight unique value proposition"
      ]
    });

  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI summary',
      error: error.message
    });
  }
};

const generateTemplateSummary = (profile) => {
  const { experience, education, technicalSkills, softSkills } = profile;
  
  const experienceLabel = getExperienceLabel(experience.length);
  const primarySkills = technicalSkills.slice(0, 3).join(', ') || 'relevant tools and technologies';
  const topEducation = education[0]?.degree || 'relevant education';
  const keyStrengths = softSkills.slice(0, 2).join(' and ') || 'problem-solving and communication';

  const templates = [
    `${experienceLabel} professional with expertise in ${primarySkills}. Proven track record of delivering practical solutions, learning quickly, and contributing to team goals. Strong background in ${topEducation} with exceptional ${keyStrengths} skills. Committed to excellence and continuous learning in dynamic environments.`,
    
    `Results-oriented ${experienceLabel.toLowerCase()} professional specializing in ${primarySkills}. Demonstrated ability to collaborate with cross-functional teams and contribute to strategic initiatives. Educational foundation in ${topEducation} complemented by strong ${keyStrengths} capabilities.`,
    
    `Dynamic ${experienceLabel.toLowerCase()} professional combining technical expertise in ${primarySkills} with strong analytical and problem-solving abilities. Proven success in project execution and team collaboration. ${topEducation} graduate with focus on innovation and quality delivery.`
  ];

  return templates;
};

const getExperienceLabel = (count) => {
  if (!count) return 'Entry-level';
  if (count === 1) return '1+ year experienced';
  return `${count}+ years experienced`;
};

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

const sanitizeSummary = (summary = '') => {
  return String(summary)
    .replace(/\[object Object\]/gi, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
};

module.exports = {
  // ... existing exports
  generateAISummary
};
