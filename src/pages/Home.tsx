import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import './Home.css'

const Home = () => {
  const [time, setTime] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (clickCount >= 7) {
      navigate('/bored')
    }
  }, [clickCount, navigate])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const handleIngredientsClick = () => {
    setClickCount(prev => prev + 1)
  }

  return (
    <Layout>
      <div className="home-container">
        <div className="title-stack">
          <h1 className="title-line">The</h1>
          <h1 className="title-line clickable-title" onClick={handleIngredientsClick}>
            Ingredients
          </h1>
          <div className="clock">{formatTime(time)}</div>
        </div>
      </div>
    </Layout>
  )
}

export default Home

