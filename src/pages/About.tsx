import Layout from '../components/Layout'
import './PageStyles.css'

const About = () => {
  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">About</h1>
        <p className="page-content">The Ingredients is a creative collective passionate about crafting exceptional digital experiences through thoughtful design and innovative solutions.</p>
        <p className="page-content">We bring together expertise in web design, UX/UI design, and cutting-edge digital experiences to help bring your vision to life.</p>
        <p className="page-content">Let's learn about <a href="https://developer.mozilla.org/en-US/docs/Web/API" target="_blank" rel="noopener noreferrer" className="inline-link">Web APIs</a> together!</p>
        <p className="page-content">Got some UX ideas? Let's <a href="mailto:theingredientscollective@gmail.com?subject=Let's chat!" className="inline-link">chat!</a></p>
      </div>
    </Layout>
  )
}

export default About

