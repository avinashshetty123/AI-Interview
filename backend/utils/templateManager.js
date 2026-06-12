// Template Manager - Replaces Python Jinja2 templates
// All prompts for resume parsing, evaluation, and GitHub project selection

const templates = {
  // System message for general resume parsing sections
  system_message: (params) => {
    const sectionName = params.section_name_param || 'resume section';
    return `You are an expert resume parser. Extract ONLY the ${sectionName} section from resumes and format it according to the JSON Resume specification.

**CRITICAL: You must respond with ONLY valid JSON. Do not include any explanatory text, thinking process, markdown formatting, or <think> tags. Return ONLY the JSON object.**

Return ONLY the ${sectionName} section in JSON format.`;
  },

  // Basics section extraction
  basics: (params) => {
    const content = params.text_content || '';
    return `Extract ONLY the basic information (name, email, phone, location, profiles) from this resume.

--- The input resume markdown starts here ---

${content}

--- The input resume markdown ends here ---

Return ONLY a JSON object with this structure:
{
  "basics": {
    "name": "Full name",
    "email": "Email address", 
    "phone": "Phone number",
    "url": null,
    "summary": null,
    "location": {
      "city": "City",
      "countryCode": "Country code"
    },
    "profiles": [
      {
        "network": "Platform name",
        "url": "Full URL",
        "username": "Username from URL"
      }
    ]
  }
}

**IMPORTANT**: If there is any About Me or Summary section, add that to the summary section of the basics

**CRITICAL**: For profiles section:
- ONLY extract URLs that are EXPLICITLY present in the resume markdown
- Look for URLs in markdown format [text](url) or plain URLs
- DO NOT create any URLs that are not in the original resume
- DO NOT add generic platform URLs like "https://github.com" or "https://linkedin.com" unless they are actually present in the resume
- If no URLs are found in the resume, return an empty profiles array: "profiles": []
- If a URL is present but you cannot determine the network or username, still include it with the available information
- If the URL is of the format github.io or personal domain, mark the network as "Portfolio"
- If there is any link at the header of the resume or Portfolio link, add that as url in the basics

**IMPORTANT**: Return ONLY valid JSON. Do not include any explanatory text.`;
  },

  // Work experience section extraction
  work: (params) => {
    const content = params.text_content || '';
    return `Extract ONLY the work experience from this resume.

--- The input markdown starts here ---

${content}

--- The input markdown ends here ---

Return ONLY a JSON object with this structure:
{
  "work": [
    {
      "name": "Company name",
      "position": "Job title", 
      "startDate": "Start date (YYYY-MM)",
      "endDate": "End date (YYYY-MM) or 'Present'",
      "summary": "Job description",
      "highlights": ["Achievement 1", "Achievement 2"]
    }
  ]
}

**IMPORTANT**: 

For date extraction, follow these rules carefully:

1. Look for date ranges in the work experience section. These often appear as "Start – End" or "Start - End" format.
2. Date ranges can be separated by any of these characters: hyphen "-", en dash "–", em dash "—", or the word "to".
3. Carefully extract both the start and end dates from these ranges.
4. If a position is current/ongoing, the end date may be indicated by words like "Present", "Current", "Now", "Ongoing", etc.
5. Look for dates near position titles or company names
6. Dates might be formatted as "Month Year" or "MM/YYYY" or other variations
7. If dates appear as "Month Year - Month Year", extract both parts
8. If only years are provided (e.g., "2019-2021"), use the year information only

**IMPORTANT**: Return ONLY valid JSON. Do not include any explanatory text.`;
  },

  // Education section extraction
  education: (params) => {
    const content = params.text_content || '';
    return `Extract ONLY the education information from this resume.

--- The input markdown starts here ---

${content}

--- The input markdown ends here ---

Return ONLY a JSON object with this structure:
{
  "education": [
    {
      "institution": "School/University name",
      "area": "Field of study",
      "studyType": "Degree type",
      "startDate": "Start date (YYYY-MM)",
      "endDate": "End date (YYYY-MM)",
      "score": "GPA/Percentage"
    }
  ]
}

**IMPORTANT**: Return ONLY valid JSON. Do not include any explanatory text.`;
  },

  // Skills section extraction
  skills: (params) => {
    const content = params.text_content || '';
    return `Extract ONLY the skills information from this resume.

--- The input markdown starts here ---

${content}

--- The input markdown ends here ---

Return ONLY a JSON object with this structure:
{
  "skills": [
    {
      "name": "Skill category",
      "level": null,
      "keywords": ["Skill 1", "Skill 2"]
    }
  ]
}

**IMPORTANT**: Return ONLY valid JSON. Do not include any explanatory text.`;
  },

  // Projects section extraction
  projects: (params) => {
    const content = params.text_content || '';
    return `Extract ONLY the projects information from this resume.

--- The input markdown starts here ---

${content}

--- The input markdown ends here ---

Return ONLY a JSON object with this structure:
{
  "projects": [
    {
      "name": "Project name",
      "description": "Project description",
      "url": "Project URL",
      "technologies": ["Tech 1", "Tech 2"]
    }
  ]
}

**IMPORTANT**: Return ONLY valid JSON. Do not include any explanatory text.`;
  },

  // Awards section extraction
  awards: (params) => {
    const content = params.text_content || '';
    return `Extract ONLY the awards and honors information from this resume.

--- The input markdown starts here ---

${content}

--- The input markdown ends here ---

Return ONLY a JSON object with this structure:
{
  "awards": [
    {
      "title": "Award name",
      "date": "Award date (YYYY-MM)",
      "awarder": "Awarding organization"
    }
  ]
}

**IMPORTANT**: Return ONLY valid JSON. Do not include any explanatory text.`;
  },

  // Resume evaluation system message (Python evaluator.py logic)
  resume_evaluation_system_message: (params) => {
    return `You are an expert technical recruiter scoring resumes. Return ONLY valid JSON. No summaries, no extra fields.

FAIRNESS: Ignore name, gender, college, GPA, location. Score only technical skills, project quality, open source, and work experience.

SCORING RULES:
- open_source: Personal GitHub repos alone = 5-10pts max. True open source = contributing to OTHER people's projects. GSoC = high score.
- self_projects: Simple CRUD/todo/weather/calculator = 1-9pts. Complex multi-feature apps with real impact = 20-30pts. No links = -3 to -5pts per project.
- production: Score work/volunteer/internship experience. Founder/co-founder roles get extra points.
- technical_skills: Breadth of languages, frameworks, and demonstrated problem-solving.

MANDATORY: Fill ALL FOUR categories. Evidence cannot be empty. Scores cannot be negative.
LIMITS: open_source≤35, self_projects≤30, production≤25, technical_skills≤10, bonus≤20, total≤120.

When GitHub data is provided, check project_type field: 'open_source'=multiple contributors, 'self_project'=single contributor.`;
  },

  // Resume evaluation criteria (Python score.py logic)
  resume_evaluation_criteria: (params) => {
    const content = params.text_content || '';
    return `Score this resume for a Software Intern role at HackerRank. Return ONLY the JSON below, no other text.

SCORING CRITERIA:
- open_source (0-35): Contributing to OTHER people's repos = high score. Personal repos only = ≤10pts. GSoC=+5bonus. Hacktoberfest alone = 3-5pts max.
- self_projects (0-30): Complex/multi-feature/AI/real-world apps = 20-30pts. Tutorial clones/CRUD/todo = 1-9pts. No project links = -3 to -5pts each.
- production (0-25): Internships, jobs, volunteer. Founder/co-founder = extra points.
- technical_skills (0-10): Languages, frameworks, breadth, problem-solving evidence.

BONUS (max 20pts total): GSoC=+5, Girl Script SoC=+3, founder=+3-5, portfolio site=+2, LinkedIn=+1, tech blogs=+1-3.
DEDUCTIONS: Tutorial-only projects=-2 to -5. Projects without links=-3 to -5 each. All self_project GitHub type=-3 to -5.

PROGRAM NOTE: "Google Summer of Code (GSoC)" and "Girl Script Summer of Code" are different programs. Never confuse them.

Return this EXACT JSON structure:
{
    "scores": {
        "open_source": {"score": 0, "max": 35, "evidence": "string"},
        "self_projects": {"score": 0, "max": 30, "evidence": "string"},
        "production": {"score": 0, "max": 25, "evidence": "string"},
        "technical_skills": {"score": 0, "max": 10, "evidence": "string"}
    },
    "bonus_points": {"total": 0, "breakdown": "string"},
    "deductions": {"total": 0, "reasons": "string"},
    "key_strengths": ["strength1", "strength2"],
    "areas_for_improvement": ["improvement1", "improvement2"]
}

Resume to evaluate:

${content}`;
  },

  // GitHub project selection (Python github.py logic)
  github_project_selection: (params) => {
    const projectsData = params.projects_data || '[]';
    return `You are an expert technical recruiter analyzing GitHub repositories to identify the most impressive and relevant projects for a software engineering position.

**ABSOLUTE REQUIREMENT**: You must ONLY select projects where the author_commit_count is 4 or higher. Projects with 1, 2, or 3 commits indicate minimal involvement and should NEVER be selected.

Given a list of GitHub repositories, select the TOP 7 most impressive projects that would be most relevant for evaluating a candidate's technical skills and experience.

**IMPORTANT: Contributions to Popular Open Source Projects**
- **HIGH PRIORITY**: Contributions to well-known, popular open source projects (1000+ stars) are extremely valuable, even if the contribution is small
- Popular projects include: React, Vue, Angular, Node.js, Express, Django, Flask, TensorFlow, PyTorch, Kubernetes, Docker, VS Code, etc.
- A small contribution to a popular project (bug fix, documentation, feature) is often more impressive than a complete personal project
- Look for repositories that are forks of popular projects where the candidate has made meaningful contributions
- Consider the impact and reach of the project, not just the size of the contribution

**Selection Criteria (in order of importance):**
1. **Author Contribution Level**: Projects where the candidate has made significant contributions (high author_commit_count) - HIGHEST PRIORITY
2. **Popular Open Source Contributions**: Contributions to well-known projects (1000+ stars) - HIGH PRIORITY
3. **Technical Complexity**: Projects that demonstrate advanced programming concepts, architecture, or problem-solving
4. **Real-world Impact**: Projects with actual users, deployments, or practical applications
5. **Code Quality**: Well-documented, maintained, and professional code
6. **Community Engagement**: Projects with stars, forks, or community contributions
7. **Technology Stack**: Projects using modern, relevant technologies
8. **Originality**: Unique projects rather than tutorial-based or classroom assignments

**Projects to PRIORITIZE:**
- Projects with high author_commit_count (15+ commits) - indicates substantial involvement and deep engagement
- Projects with moderate author_commit_count (5-14 commits) - shows meaningful contribution
- Contributions to popular open source projects (React, Vue, Angular, Node.js, Express, Django, Flask, TensorFlow, PyTorch, Kubernetes, Docker, VS Code, etc.)
- Forks of popular projects with meaningful contributions
- Projects with significant community adoption (100+ stars)
- Projects that solve real-world problems
- Well-documented and maintained projects

**Projects to AVOID:**
- Projects with very low author_commit_count (1-3 commits) - these indicate minimal involvement and should be avoided
- Simple tutorial projects (e.g., "Hello World", "HELLO-WORLD", basic calculators) - unless they're contributions to popular projects
- Classroom assignments with generic names
- Projects with very low stars/forks and no meaningful activity
- Very old projects with no recent activity
- Personal projects with no real-world impact (unless they demonstrate exceptional technical complexity)

**Repository Data:**
${projectsData}

**FILTERING STEP:**
1. First, sort all projects by author_commit_count in descending order (highest to lowest)
2. Filter out all projects with author_commit_count less than 4
3. Only consider projects where the candidate has made at least 4 commits
4. Start selection from the top of the sorted list (highest commit counts first)

**CRITICAL REQUIREMENTS:**
- Select exactly 7 UNIQUE projects (no duplicates) if 7 or more qualifying projects exist
- If fewer than 7 qualifying projects exist, select ALL of them (do not pad with additional projects)
- Do not select the same repository multiple times
- Ensure all selected projects are distinct and represent different aspects of the candidate's skills
- **HARD REQUIREMENT**: Only select projects where author_commit_count is 4 or higher
- **HARD REQUIREMENT**: Do NOT select any project with author_commit_count of 1, 2, or 3
- **HARD REQUIREMENT**: Start selection from projects with the highest author_commit_count

Select exactly 7 unique projects that best represent the candidate's technical abilities. 

**CRITICAL: Minimum Contribution Threshold**
- Only select projects where author_commit_count is 4 or higher
- Projects with 1-3 commits indicate minimal involvement and should be excluded
- Prioritize projects with 15+ commits (substantial involvement)
- Then prioritize projects with 5-14 commits (meaningful contribution)

**Available High-Contribution Projects:**
Look for projects with author_commit_count of 15 or higher first, then projects with 5-14 commits. Start your selection from projects with the highest commit counts.

Prioritize contributions to popular open source projects over personal projects. Respond with a JSON array containing only the selected project objects:

[
  {
    "name": "Project name",
    "description": "Project description",
    "github_url": "GitHub URL",
    "live_url": "Live URL if available",
    "technologies": ["tech1", "tech2"],
    "reason_for_project_selection": "Reason why this project is selected",
    "author_commit_count": 0,
    "total_commit_count": 0,
    "github_details": {
      "stars": 0,
      "forks": 0,
      "language": "Primary language",
      "description": "Description",
      "created_at": "Creation date",
      "updated_at": "Last updated date",
      "topics": ["topic1", "topic2"],
      "open_issues": 0,
      "size": 0,
      "fork": false,
      "archived": false,
      "default_branch": "main"
    }
  }
]

Respond only with valid JSON, no additional text.`;
  }
};

// Template manager class
class TemplateManager {
  renderTemplate(templateName, params = {}) {
    if (!templates[templateName]) {
      console.error(`Template not found: ${templateName}`);
      return null;
    }
    
    try {
      const template = templates[templateName];
      return template(params);
    } catch (error) {
      console.error(`Error rendering template ${templateName}:`, error);
      return null;
    }
  }

  // Get all available templates
  getAvailableTemplates() {
    return Object.keys(templates);
  }
}

module.exports = TemplateManager;
