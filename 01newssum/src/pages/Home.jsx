import { useEffect, useState } from 'react'
import ArticleCard from '../components/ArticleCard'
import Tabs from '../components/Tabs'
import { getNewsByCategory } from '../api/newsAPI'

export default function Home() {
  const [articles, setArticles] = useState([])
  const [category, setCategory] = useState('general')
  const [loading, setLoading] = useState(false)
  const [slowLoad, setSlowLoad] = useState(false)

  useEffect(() => {
    let intervalId;

    const fetchNews = async (isBackground = false) => {
      // Only show the loading text on the very first initial load
      if (!isBackground) setLoading(true)

      // If it takes more than 5s, show a "waking up server" hint
      const slowTimer = !isBackground
        ? setTimeout(() => setSlowLoad(true), 5000)
        : null

      try {
        const data = await getNewsByCategory(category)
        if (data) {
          setArticles(data)
        }
      } catch (err) {
        console.error("Error fetching news:", err)
      } finally {
        if (!isBackground) {
          clearTimeout(slowTimer)
          setLoading(false)
          setSlowLoad(false)
        }
      }
    }

    // 1. Fetch immediately on load or category change
    fetchNews()

    // 2. Continually fetch in the background every 2 minutes
    intervalId = setInterval(() => {
      fetchNews(true) // Pass true so it doesn't trigger the "Loading..." text
    }, 2 * 60 * 1000)

    // Cleanup interval when leaving the page or switching tabs
    return () => clearInterval(intervalId)
  }, [category])

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
      <header className="mb-10 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Live Feed Updates
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Discover the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-indigo-400">Extraordinary</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Curated global intelligence powered by cutting-edge summarization. Stay informed without the noise.
        </p>
      </header>
      
      <div className="flex justify-center mb-10">
        <Tabs setCategory={setCategory} current={category} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-70">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-brand-500 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 animate-pulse font-medium">Curating your feed...</p>
          {slowLoad && (
            <p className="text-slate-500 text-sm mt-2">
              ⏳ Server is waking up — this can take up to 60s on first load
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, i) => (
            <ArticleCard key={i} article={article} />
          ))}
          {(!articles || articles.length === 0) && (
            <div className="col-span-full py-20 text-center text-slate-500">
              No articles found for this category at the moment.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
