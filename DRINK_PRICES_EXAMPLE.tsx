/**
 * EXAMPLE COMPONENT - NOT TO BE ADDED TO EXISTING CODE
 * This is a reference design showing how drink prices could be displayed
 */

import { useState } from 'react'

// Extended interface (would be added to Coffee.tsx)
interface DrinkPrice {
  name: string        // e.g., "Latte", "Mocha", "Vanilla Latte"
  price: number      // Price in USD
  size?: string      // Optional: "Small", "Medium", "Large"
  currency?: string  // Default: "USD"
}

interface CoffeeRoasterWithPrices {
  id: number
  name: string
  lat: number
  lon: number
  distance?: number
  source?: 'OSM' | 'Google'
  drinkPrices?: DrinkPrice[]
  priceSource?: 'user' | 'api' | 'estimated'
  tags?: {
    'formatted_address'?: string
    phone?: string
    website?: string
  }
}

// Example component for displaying prices
const CoffeeShopWithPrices = ({ roaster }: { roaster: CoffeeRoasterWithPrices }) => {
  const [showPrices, setShowPrices] = useState(false)

  return (
    <div className="coffee-shop-item">
      <div className="coffee-shop-name">{roaster.name}</div>
      <div className="coffee-shop-address">{roaster.tags?.['formatted_address']}</div>
      
      {roaster.distance !== undefined && (
        <div className="coffee-shop-distance">
          📍 {roaster.distance.toFixed(1)} mi away
        </div>
      )}

      {/* Price Section */}
      {roaster.drinkPrices && roaster.drinkPrices.length > 0 && (
        <div className="coffee-shop-prices">
          <button 
            className="price-toggle-button"
            onClick={() => setShowPrices(!showPrices)}
            aria-label={showPrices ? 'Hide prices' : 'Show prices'}
          >
            {showPrices ? '▼' : '▶'} 
            <span className="price-toggle-text">
              {showPrices ? 'Hide Prices' : 'View Prices'}
            </span>
            {roaster.priceSource === 'estimated' && (
              <span className="price-badge">Estimated</span>
            )}
            {roaster.priceSource === 'user' && (
              <span className="price-badge community">Community</span>
            )}
          </button>

          {showPrices && (
            <div className="price-list">
              {roaster.drinkPrices.map((drink, index) => (
                <div key={index} className="price-item">
                  <span className="price-drink-name">{drink.name}</span>
                  {drink.size && (
                    <span className="price-size">({drink.size})</span>
                  )}
                  <span className="price-amount">
                    ${drink.price.toFixed(2)}
                  </span>
                </div>
              ))}
              
              {/* Optional: Add/Update Prices Button */}
              <button className="add-prices-button">
                + Add/Update Prices
              </button>
            </div>
          )}
        </div>
      )}

      {/* Show estimated price if no specific prices but price_level available */}
      {!roaster.drinkPrices && roaster.priceSource === 'estimated' && (
        <div className="coffee-shop-estimated-price">
          💰 Estimated: $5-6 per drink
        </div>
      )}

      {/* No prices available */}
      {!roaster.drinkPrices && roaster.priceSource !== 'estimated' && (
        <div className="coffee-shop-no-prices">
          <button className="add-prices-button-small">
            + Add Prices
          </button>
        </div>
      )}
    </div>
  )
}

// Example CSS (would be added to Coffee.css)
const exampleStyles = `
.coffee-shop-prices {
  margin-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 0.75rem;
}

.price-toggle-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.7);
  font-size: 0.9rem;
  padding: 0.25rem 0;
  width: 100%;
  text-align: left;
}

.price-toggle-button:hover {
  color: rgba(0, 0, 0, 0.9);
}

.price-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.6);
}

.price-badge.community {
  background: rgba(76, 175, 80, 0.1);
  color: rgba(76, 175, 80, 0.8);
}

.price-list {
  margin-top: 0.5rem;
  padding-left: 1rem;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.price-item:last-child {
  border-bottom: none;
}

.price-drink-name {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.8);
}

.price-size {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.5);
  margin-left: 0.5rem;
}

.price-amount {
  font-weight: 600;
  color: rgba(0, 0, 0, 0.9);
}

.add-prices-button {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  width: 100%;
  transition: all 0.2s ease;
}

.add-prices-button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.coffee-shop-estimated-price {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
  font-style: italic;
}

.coffee-shop-no-prices {
  margin-top: 0.5rem;
}

.add-prices-button-small {
  padding: 0.375rem 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.add-prices-button-small:hover {
  background: rgba(0, 0, 0, 0.1);
}
`

export default CoffeeShopWithPrices

