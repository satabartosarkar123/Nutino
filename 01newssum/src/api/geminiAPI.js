import axios from 'axios'
import { getToken } from './authAPI'

// Backend API base URL — default to localhost to avoid Render cold starts
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'

// Render free tier can take up to 60s to cold start — use a generous timeout
const TIMEOUT_MS = 70_000

/**
 * Summarize an article via the backend pipeline.
 * The backend handles: validation → Gemini API call → storage.
 * No API key is exposed to the frontend.
 *
 * When authenticated, the Bearer token is attached so the pipeline
 * can use the user's persona profile for customised prompts.
 *
 * @param {string} articleText - The article content to summarize
 * @param {object} metadata - Optional metadata (title, source, date, url)
 * @returns {object} { status, summary, processing_time } or { status, message }
 */
export const summarizeArticle = async (articleText, metadata = {}) => {
  try {
    const token = getToken()
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const response = await axios.post(
      `${API_BASE}/api/summarize`,
      {
        content: articleText,
        ...metadata,
      },
      { headers, timeout: TIMEOUT_MS }
    )
    return response.data
  } catch (error) {
    const errorData = error.response?.data
    console.error('Summarization error:', errorData || error.message)
    return {
      status: 'error',
      message: errorData?.message || 'Failed to connect to summarization service',
    }
  }
}
