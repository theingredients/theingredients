import Layout from '../components/Layout'
import './PageStyles.css'

const Contact = () => {
  const handleEmailClick = () => {
    const subject = encodeURIComponent('Let\'s talk!')
    const body = encodeURIComponent('Hello Ingredients team,\n\nI would like to talk about...')
    window.location.href = `mailto:theingredientscollective@gmail.com?subject=${subject}&body=${body}`
  }

  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">Contact</h1>
        <p className="page-content">Get in touch with us.</p>
        <button onClick={handleEmailClick} className="email-button">
          Email Us
        </button>
      </div>
    </Layout>
  )
}

export default Contact

