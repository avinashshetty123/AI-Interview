// ATS Checker API Service
import axios from 'axios';
import { apiUrl } from './api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getHeaders = () => ({
  'Authorization': `Bearer ${getAuthToken()}`,
  'Content-Type': 'application/json',
});

// Evaluate single resume
export const evaluateResume = async (resumeId, roleType = 'tech', jobTitle = 'General', githubUrl = null) => {
  try {
    const response = await axios.post(
      apiUrl('/ats/evaluate'),
      {
        resumeId,
        roleType,
        jobTitle,
        githubUrl,
      },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};

// Get evaluation history
export const getEvaluationHistory = async (roleType = null, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (roleType) params.append('roleType', roleType);
    params.append('limit', limit);

    const response = await axios.get(
      apiUrl(`/ats/history?${params.toString()}`),
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};

// Get detailed evaluation
export const getDetailedEvaluation = async (evaluationId) => {
  try {
    const response = await axios.get(
      apiUrl(`/ats/evaluation/${evaluationId}`),
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};

// Compare two evaluations
export const compareEvaluations = async (eval1Id, eval2Id) => {
  try {
    const response = await axios.post(
      apiUrl('/ats/compare'),
      {
        eval1Id,
        eval2Id,
      },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};

// Bulk evaluate multiple resumes
export const bulkEvaluate = async (resumeIds, roleType = 'tech', githubUrls = {}) => {
  try {
    const response = await axios.post(
      apiUrl('/ats/bulk-evaluate'),
      {
        resumeIds,
        roleType,
        githubUrls,
      },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};

// Get ATS statistics
export const getATSStats = async () => {
  try {
    const response = await axios.get(
      apiUrl('/ats/stats'),
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};

// Get saved resumes (for resume selection)
export const getSavedResumes = async () => {
  try {
    const response = await axios.get(
      apiUrl('/resume/saved'),
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: error.message };
  }
};
