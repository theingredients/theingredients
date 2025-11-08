import Layout from '../components/Layout'
import './PageStyles.css'

const Contact = () => {
  const handleEmailClick = () => {
    const subject = encodeURIComponent('Let\'s talk!')
    const body = encodeURIComponent('Hello Ingredients!\n\nI would like to talk about...')
    window.location.href = `mailto:theingredientscollective@gmail.com?subject=${subject}&body=${body}`
  }

  const handleAudioClick = () => {
    window.open('https://or-six.vercel.app/', '_blank', 'noopener,noreferrer')
  }

  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">Contact</h1>
        <p className="page-content">Get in touch with us.</p>
        {/* <p className="page-content">Create a audio file for us using <a href="https://or-six.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-link">
          The OR (beta)
        </a>.</p> */}
        <button onClick={handleEmailClick} className="email-button">
          Email Us
        </button>
        <button onClick={handleAudioClick} className="email-button">
          Create Audio With Us
        </button>
      </div>
    </Layout>
  )
}

export default Contact

