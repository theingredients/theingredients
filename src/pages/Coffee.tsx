import Layout from '../components/Layout'
import BuyMeACoffee from '../components/BuyMeACoffee'
import './PageStyles.css'

const Coffee = () => {
  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">Buy Me a Coffee</h1>
        <p className="page-content">
          If you enjoy The Ingredients and want to support its development, 
          consider buying me a coffee! ☕
        </p>
        <BuyMeACoffee />
      </div>
    </Layout>
  )
}

export default Coffee

