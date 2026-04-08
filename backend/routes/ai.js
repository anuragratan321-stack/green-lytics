const express = require('express')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { generateInsights } = require('../services/aiService')

const router = express.Router()

router.get('/models', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in environment variables.' })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    let models = []

    if (typeof genAI.listModels === 'function') {
      const response = await genAI.listModels()
      models = response?.models || []
    } else {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`)
      if (!response.ok) {
        const details = await response.text()
        throw new Error(`Models API failed (${response.status}): ${details}`)
      }
      const payload = await response.json()
      models = payload?.models || []
    }

    return res.json({ models })
  } catch (error) {
    console.error('AI models debug route error:', error)
    return res.status(500).json({
      error: 'Failed to fetch Gemini models.',
      details: error.message,
    })
  }
})

router.post('/suggestions', async (req, res) => {
  try {
    const inputData = req.body

    if (!inputData || typeof inputData !== 'object' || Array.isArray(inputData)) {
      return res.status(400).json({ error: 'Invalid ESG input data.' })
    }

    const result = await generateInsights(inputData)
    return res.json({
      quickInsights: Array.isArray(result?.quickInsights) ? result.quickInsights : [],
      insights: Array.isArray(result?.insights) ? result.insights : [],
      recommendations: Array.isArray(result?.recommendations) ? result.recommendations : [],
      rawText: typeof result?.rawText === 'string' ? result.rawText : '',
      source: result?.source || 'fallback',
    })
  } catch (error) {
    console.error('AI insights route error:', error.message)
    return res.status(500).json({ error: 'Failed to generate insights.' })
  }
})

module.exports = router
