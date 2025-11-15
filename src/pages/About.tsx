import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import './PageStyles.css'

const About = () => {
  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">About</h1>
        <p className="page-content">The Ingredients was created to design and build tools that help simplify daily tasks.</p>
        <p className="page-content">Let's learn about <a href="https://developer.mozilla.org/en-US/docs/Web/API" target="_blank" rel="noopener noreferrer" className="inline-link">Web APIs</a> together!</p>
        <p className="page-content">Let's <a href="mailto:theingredientscollective@gmail.com?subject=Let's chat!" className="inline-link">chat</a> and/or <Link to="/coffee" className="inline-link">buy me a coffee!</Link></p>
      </div>
    </Layout>
  )
}

export default About

