const ResumeParser = require('../utils/resumeParser');

const parseResumeForBuilder = async (req, res) => {
  try {
    console.log('Parse resume endpoint hit');
    console.log('File received:', req.file ? 'Yes' : 'No');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const parser = new ResumeParser();
    
    // Extract text from uploaded file
    const fileType = req.file.originalname.split('.').pop().toLowerCase();
    console.log('Extracting text from file type:', fileType);
    
    const extractedText = await parser.extractText(req.file.buffer, fileType);
    console.log('Text extracted, length:', extractedText.length);
    
    // Parse the extracted text
    const parsedData = parser.extractKeywords(extractedText);
    console.log('Data parsed:', Object.keys(parsedData));
    
    // Convert parsed data to resume builder format
    const resumeBuilderData = await convertToResumeFormat(parsedData, extractedText);
    console.log('Resume data converted');
    
    res.json({
      success: true,
      data: resumeBuilderData,
      atsScore: parsedData.atsQuality.score,
      suggestions: parsedData.atsQuality.suggestions
    });

  } catch (error) {
    console.error('Error parsing resume:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse resume: ' + error.message
    });
  }
};

const convertToResumeFormat = async (parsedData, fullText) => {
  // Extract personal information from text
  const personalInfo = extractPersonalInfo(fullText);
  
  // Convert experience data
  const experience = parsedData.experience.map(exp => ({
    id: Date.now() + Math.random(),
    jobTitle: exp.title || '',
    company: exp.company || '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrentJob: false,
    description: exp.description || '',
    achievements: ['']
  }));

  // Convert education data
  const education = parsedData.education.map(edu => ({
    id: Date.now() + Math.random(),
    degree: edu.degree || '',
    institution: edu.description?.split(' ')[0] || '',
    location: '',
    startDate: '',
    endDate: edu.year || '',
    gpa: '',
    description: edu.description || '',
    isCurrentlyStudying: false
  }));

  // Convert projects data
  const projects = parsedData.projects.map(proj => ({
    id: Date.now() + Math.random(),
    name: proj.title || '',
    description: proj.description || '',
    technologies: extractTechnologies([proj.description, ...(proj.highlights || [])].join(' ')),
    githubUrl: '',
    liveUrl: '',
    startDate: '',
    endDate: '',
    highlights: proj.highlights?.length > 0 ? proj.highlights : ['']
  }));

  // Convert skills data
  const skills = {
    technical: parsedData.skills.map(skill => ({ name: skill, level: 'Intermediate' })),
    soft: ['Communication', 'Problem Solving', 'Team Work', 'Leadership']
  };

  // Generate AI summary if not present
  let summary = extractSummary(fullText);
  if (!summary && parsedData.skills.length > 0) {
    // Generate a basic summary without AI for now
    const skillsText = skills.technical.slice(0, 3).map(skill => skill.name).join(', ');
    summary = `Experienced professional with expertise in ${skillsText}. Proven track record in delivering high-quality solutions and working effectively in team environments.`;
  }

  return {
    personalInfo,
    summary,
    experience,
    education: education.length > 0 ? education : [{
      id: Date.now(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      description: '',
      isCurrentlyStudying: false
    }], // Ensure at least one education entry
    skills,
    projects,
    certifications: []
  };
};

const extractPersonalInfo = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // Extract name (usually first non-empty line)
  const fullName = lines[0] || '';
  
  // Extract email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';
  
  // Extract phone
  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';
  
  // Extract LinkedIn
  const linkedinMatch = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/i);
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : '';
  
  // Extract GitHub
  const githubMatch = text.match(/github\.com\/[a-zA-Z0-9-]+/i);
  const github = githubMatch ? `https://${githubMatch[0]}` : '';
  
  // Extract location (look for city, state patterns)
  const locationMatch = text.match(/([A-Z][a-z]+,\s*[A-Z]{2})|([A-Z][a-z]+\s*[A-Z][a-z]+,\s*[A-Z]{2})/);
  const location = locationMatch ? locationMatch[0] : '';

  return {
    fullName,
    email,
    phone,
    location,
    linkedin,
    github,
    website: '',
    profilePicture: ''
  };
};

const extractSummary = (text) => {
  const summaryPatterns = [
    /summary\s*:?\s*([^]*?)(?=\n\s*\n|\n[A-Z]|$)/i,
    /profile\s*:?\s*([^]*?)(?=\n\s*\n|\n[A-Z]|$)/i,
    /objective\s*:?\s*([^]*?)(?=\n\s*\n|\n[A-Z]|$)/i
  ];
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\n/g, ' ').substring(0, 500);
    }
  }
  
  return '';
};

const extractTechnologies = (description) => {
  if (!description) return [];
  
  const techKeywords = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'MongoDB', 'PostgreSQL',
    'Express.js', 'Next.js', 'Vue.js', 'Django', 'Flask', 'AWS', 'Docker', 'Git',
    'HTML', 'CSS', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift'
  ];
  
  return techKeywords.filter(tech => 
    description.toLowerCase().includes(tech.toLowerCase())
  );
};

module.exports = {
  parseResumeForBuilder
};
