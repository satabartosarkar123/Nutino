/**
 * Summarize Controller — Handles single and batch summarization
 * 
 * POST /api/summarize       — Single article
 * POST /api/summarize/batch  — Multiple articles (concurrent)
 */

import { ingestArticle, summarizeArticle, storeSummary } from '../pipeline/pipeline.js'
import { logPipeline, logError } from '../pipeline/logger.js'

// ─── Single Article Summarization ────────────────────────────────────────────

export const summarizeSingle = async (req, res) => {
  logPipeline('Single summarization request received')
  const startTime = Date.now()

  try {
    const { content, title, source, date, url } = req.body

    // Stage 1: Ingest & Validate
    const ingestionResult = await ingestArticle(content, { title, source, date, url })
    if (ingestionResult.status === 'error') {
      return res.status(400).json({
        status: 'error',
        message: ingestionResult.message,
      })
    }

    // Stage 2: Summarize (persona-aware when user is authenticated)
    const userProfile = req.user?.profile || null
    const summaryResult = await summarizeArticle(ingestionResult.data.content, userProfile)
    if (summaryResult.status === 'error') {
      return res.status(502).json({
        status: 'error',
        message: summaryResult.message,
        processing_time: summaryResult.processing_time,
      })
    }

    // Stage 3: Store (only if summarization succeeded)
    const storeResult = await storeSummary({
      title: title || 'Untitled',
      source: source || 'Unknown',
      date: date || new Date().toLocaleDateString(),
      url: url || '',
      summary: summaryResult.summary,
    })

    if (storeResult.status === 'error') {
      // Summarization succeeded but storage failed — still return the summary
      logError('Storage failed but summary was generated successfully')
      return res.status(200).json({
        status: 'success',
        summary: summaryResult.summary,
        processing_time: summaryResult.processing_time,
        storage_warning: 'Summary generated but could not be saved to database',
      })
    }

    // Full success
    const totalTime = `${Date.now() - startTime}ms`
    logPipeline('Single summarization completed', { totalTime })

    return res.status(200).json({
      status: 'success',
      summary: summaryResult.summary,
      processing_time: totalTime,
      stored_id: storeResult.id,
    })
  } catch (error) {
    logError('Unexpected error in single summarization', { error: error.message })
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error: ' + error.message,
    })
  }
}

// ─── Batch Article Summarization (Concurrent) ────────────────────────────────

export const summarizeBatch = async (req, res) => {
  logPipeline('Batch summarization request received')
  const startTime = Date.now()

  try {
    const { articles } = req.body

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input: articles must be a non-empty array',
      })
    }

    if (articles.length > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input: maximum 10 articles per batch request',
      })
    }

    logPipeline(`Processing ${articles.length} articles concurrently`)

    // Process all articles in parallel
    const results = await Promise.allSettled(
      articles.map(async (article, index) => {
        const { content, title, source, date, url } = article

        // Stage 1: Ingest
        const ingestionResult = await ingestArticle(content, { title, source, date, url })
        if (ingestionResult.status === 'error') {
          return { status: 'error', message: ingestionResult.message, index }
        }

        // Stage 2: Summarize (persona-aware when user is authenticated)
        const userProfile = req.user?.profile || null
        const summaryResult = await summarizeArticle(ingestionResult.data.content, userProfile)
        if (summaryResult.status === 'error') {
          return { status: 'error', message: summaryResult.message, index }
        }

        // Stage 3: Store
        const storeResult = await storeSummary({
          title: title || 'Untitled',
          source: source || 'Unknown',
          date: date || new Date().toLocaleDateString(),
          url: url || '',
          summary: summaryResult.summary,
        })

        return {
          status: 'success',
          summary: summaryResult.summary,
          processing_time: summaryResult.processing_time,
          stored_id: storeResult.status === 'success' ? storeResult.id : null,
          index,
        }
      })
    )

    // Normalize results from Promise.allSettled
    const normalizedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return {
        status: 'error',
        message: result.reason?.message || 'Unknown error',
        index,
      }
    })

    const totalTime = `${Date.now() - startTime}ms`
    const successCount = normalizedResults.filter(r => r.status === 'success').length
    const errorCount = normalizedResults.filter(r => r.status === 'error').length

    logPipeline('Batch summarization completed', { totalTime, successCount, errorCount })

    return res.status(200).json({
      status: 'success',
      total: articles.length,
      succeeded: successCount,
      failed: errorCount,
      processing_time: totalTime,
      results: normalizedResults,
    })
  } catch (error) {
    logError('Unexpected error in batch summarization', { error: error.message })
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error: ' + error.message,
    })
  }
}
