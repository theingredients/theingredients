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
        <button 
          className="email-button"
          onClick={() => {
            // TODO: Implement local coffee shop finder functionality
            console.log('Find local coffee shops clicked')
          }}
        >
          Find Local Coffee Shops
        </button>
      </div>
    </Layout>
  )
}

export default Coffee

