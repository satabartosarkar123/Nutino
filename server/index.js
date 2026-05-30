import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './db.js'
import summaryRoutes from './routes/summaryRoutes.js'
import newsRoutes from './routes/newsRoutes.js'
import summarizeRoutes from './routes/summarizeRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { logPipeline } from './pipeline/logger.js'

// Load env variables first
dotenv.config()

// Create express app
const app = express()

// Middlewares — allow all origins for now to avoid CORS issues
app.use(cors({
  origin: '*',
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// Logging
logPipeline('Server starting...')

// Connect to MongoDB
connectDB()

// Routes — Auth & User (new)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)

// Routes — Existing pipeline
app.use('/api/summaries', summaryRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/summarize', summarizeRoutes)

// Optional test route
app.get('/', (req, res) => {
  res.send('✅ Backend is up and running!')
})

// Health check for Render uptime monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Listen on assigned port (important for Render)
const PORT = process.env.PORT || 5000
app.listen(PORT, () => logPipeline(`Server running on port ${PORT}`))
