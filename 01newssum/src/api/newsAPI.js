import axios from 'axios'
import { getToken } from './authAPI'

// Default to localhost for local testing so we don't hit Render's 60-second cold start!
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001'
const BASE_URL = `${API_BASE}/api/news`

// Render free tier can take up to 60s to cold start — use a generous timeout
const TIMEOUT_MS = 70_000

export const getNewsByCategory = async (category = 'general') => {
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const doRequest = () =>
    axios.get(BASE_URL, {
      params: { category },
      headers,
      timeout: TIMEOUT_MS,
    })

  try {
    const response = await doRequest()
    return response.data
  } catch (error) {
    // Render cold start timeout — retry once automatically
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      console.warn('⏳ Backend may be cold starting, retrying...')
      try {
        const retry = await doRequest()
        return retry.data
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError.response?.data || retryError.message)
        return []
      }
    }
    console.error('❌ Error fetching news:', error.response?.data || error.message)
    return []
  }
}
