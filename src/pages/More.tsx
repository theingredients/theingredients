import Layout from '../components/Layout'
import './PageStyles.css'

const More = () => {
  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">Timeline</h1>
        <a href="https://or-six.vercel.app/" target="_blank" rel="noopener noreferrer" className="page-content">
          The OR (beta) - audio fun
        </a>
        <a href="https://thego-navy.vercel.app/" target="_blank" rel="noopener noreferrer" className="page-content">
          The GO (beta) - geotrack to text
        </a>
        <p className="page-content">The DO (alpha) - digital organizing</p>
        <p className="page-content">The Future</p>
      </div>
    </Layout>
  )
}

export default More

