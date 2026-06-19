const ResumeParser = require('./utils/resumeParser');

const sampleResume = `
John Smith
john.smith@email.com | (555) 123-4567
linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Results-driven Software Engineer with 5+ years of experience building scalable web applications and leading cross-functional teams. Passionate about clean code and performance optimization.

WORK EXPERIENCE

Senior Software Engineer at TechCorp
2020 - Present
• Led development of microservices architecture, reducing API response time by 40% and improving system scalability
• Mentored 3 junior developers and conducted code reviews improving code quality by 25%
• Implemented CI/CD pipeline using Docker and Kubernetes, reducing deployment time from 2 hours to 15 minutes
• Drove adoption of TypeScript across codebase, reducing production bugs by 35%

Software Engineer at StartupXYZ
2018 - 2020
• Developed full-stack e-commerce platform using React and Node.js, generating $2M in revenue
• Optimized database queries reducing load time by 60%
• Built REST APIs serving 100k+ daily active users

EDUCATION

Bachelor of Science in Computer Science
State University, 2018
GPA: 3.8

TECHNICAL SKILLS
Languages: JavaScript, Python, Java, TypeScript, C++
Frontend: React, Vue.js, HTML5, CSS3, Tailwind
Backend: Node.js, Express, Django, Spring Boot
Databases: PostgreSQL, MongoDB, Redis
DevOps: Docker, Kubernetes, AWS, CI/CD
Tools: Git, Jira, VS Code, Webpack

PROJECTS

E-Commerce Platform | React, Node.js, MongoDB
• Built complete e-commerce solution with payment integration using Stripe
• Implemented real-time notifications using WebSocket
• Achieved 98% test coverage with Jest and Cypress

Task Management App | React Native, Firebase
• Cross-platform mobile app for team collaboration
• 50k+ downloads on Google Play Store

CERTIFICATIONS
AWS Solutions Architect Associate Certification - 2021
`;

const parser = new ResumeParser();

console.log('=== RESUME PARSER TEST ===\n');

// Test 1: Extract sections
console.log('1. EXTRACTING SECTIONS:');
const sections = parser.extractSections(sampleResume);
console.log('Sections found:', Object.keys(sections));
console.log('');

// Test 2: Extract skills
console.log('2. EXTRACTING SKILLS:');
const skills = parser.extractSkills(sections);
console.log(`Total skills found: ${skills.length}`);
console.log('Skills:', skills);
console.log('');

// Test 3: Extract experience
console.log('3. EXTRACTING EXPERIENCE:');
const experience = parser.extractExperience(sections);
console.log(`Total experiences found: ${experience.length}`);
experience.forEach((exp, i) => {
  console.log(`${i + 1}. ${exp.title} at ${exp.company}`);
  console.log(`   Duration: ${exp.dates}`);
});
console.log('');

// Test 4: Extract education
console.log('4. EXTRACTING EDUCATION:');
const education = parser.extractEducation(sections);
console.log(`Total education entries found: ${education.length}`);
education.forEach((edu, i) => {
  console.log(`${i + 1}. ${edu.degree}`);
  if (edu.year) console.log(`   Year: ${edu.year}`);
});
console.log('');

// Test 5: Extract projects
console.log('5. EXTRACTING PROJECTS:');
const projects = parser.extractProjects(sections);
console.log(`Total projects found: ${projects.length}`);
projects.forEach((proj, i) => {
  console.log(`${i + 1}. ${proj.title}`);
  console.log(`   Description: ${proj.description.substring(0, 80)}...`);
});
console.log('');

// Test 6: ATS Quality Assessment
console.log('6. ATS QUALITY ASSESSMENT:');
const keywords = parser.extractKeywords(sampleResume);
console.log('ATS Score:', keywords.atsQuality.score);
console.log('Rating:', keywords.atsQuality.rating);
console.log('');

console.log('=== TEST COMPLETE ===');
