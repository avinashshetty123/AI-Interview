const { optimizeText, generateSkillsSuggestions, generateProfessionalSummary } = require('../utils/textOptimizer');

const optimizeResumeText = async (req, res) => {
  try {
    const { text, type, context } = req.body;

    if (!text || !type) {
      return res.status(400).json({
        success: false,
        error: 'Text and type are required'
      });
    }

    const optimizedText = await optimizeText(text, type, context);

    res.json({
      success: true,
      originalText: text,
      optimizedText,
      type
    });
  } catch (error) {
    console.error('Error optimizing text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize text: ' + error.message
    });
  }
};

const generateSkills = async (req, res) => {
  try {
    const { experience, projects, education } = req.body;

    const skills = await generateSkillsSuggestions(experience, projects, education);

    res.json({
      success: true,
      skills
    });
  } catch (error) {
    console.error('Error generating skills:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate skills: ' + error.message
    });
  }
};

const generateSummary = async (req, res) => {
  try {
    const { personalInfo, skills, experience, education } = req.body;

    const summary = await generateProfessionalSummary(personalInfo, skills, experience, education);

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate summary: ' + error.message
    });
  }
};

const optimizeBulkText = async (req, res) => {
  try {
    const { items } = req.body; // Array of {text, type, context}

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Items must be an array'
      });
    }

    const optimizedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const optimizedText = await optimizeText(item.text, item.type, item.context);
          return {
            ...item,
            optimizedText,
            success: true
          };
        } catch (error) {
          return {
            ...item,
            optimizedText: item.text,
            success: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      items: optimizedItems
    });
  } catch (error) {
    console.error('Error optimizing bulk text:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize texts: ' + error.message
    });
  }
};

module.exports = {
  optimizeResumeText,
  generateSkills,
  generateSummary,
  optimizeBulkText
};