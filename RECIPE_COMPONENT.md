# Recipe Component

A step-by-step recipe creation component with dynamic step management.

## Files

### Recipe.tsx

```tsx
import { useState } from 'react'
import Layout from '../components/Layout'
import './Recipe.css'

interface RecipeStep {
  id: string
  text: string
}

const Recipe = () => {
  const [recipeTitle, setRecipeTitle] = useState('')
  const [steps, setSteps] = useState<RecipeStep[]>([
    { id: '1', text: '' }
  ])

  const addStep = () => {
    const newId = String(steps.length + 1)
    setSteps([...steps, { id: newId, text: '' }])
  }

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter(step => step.id !== id))
    }
  }

  const updateStep = (id: string, text: string) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, text } : step
    ))
  }

  return (
    <Layout>
      <div className="recipe-container">
        <h1 className="recipe-title">Create Recipe</h1>
        
        <div className="recipe-form">
          <div className="recipe-field">
            <label htmlFor="recipe-title-input" className="recipe-label">
              Recipe Title
            </label>
            <input
              id="recipe-title-input"
              type="text"
              className="recipe-input"
              placeholder="Enter recipe name..."
              value={recipeTitle}
              onChange={(e) => setRecipeTitle(e.target.value)}
            />
          </div>

          <div className="recipe-steps-section">
            <div className="recipe-steps-header">
              <h2 className="recipe-steps-title">Steps</h2>
              <button 
                type="button"
                className="recipe-add-step-button"
                onClick={addStep}
                aria-label="Add step"
              >
                + Add Step
              </button>
            </div>

            <div className="recipe-steps-list">
              {steps.map((step, index) => (
                <div key={step.id} className="recipe-step-item">
                  <div className="recipe-step-number">{index + 1}</div>
                  <input
                    type="text"
                    className="recipe-step-input"
                    placeholder={`Step ${index + 1}...`}
                    value={step.text}
                    onChange={(e) => updateStep(step.id, e.target.value)}
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      className="recipe-remove-step-button"
                      onClick={() => removeStep(step.id)}
                      aria-label={`Remove step ${index + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Recipe
```

### Recipe.css

```css
.recipe-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.recipe-title {
  font-size: 3rem;
  font-weight: 500;
  margin-bottom: 2rem;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 1px;
  transition: color 0.3s ease;
  text-align: center;
}

.theme-dark .recipe-title {
  color: rgba(255, 255, 255, 0.85);
}

.recipe-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.recipe-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.recipe-label {
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  transition: color 0.3s ease;
}

.theme-dark .recipe-label {
  color: rgba(255, 255, 255, 0.7);
}

.recipe-input {
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgba(0, 0, 0, 0.85);
  transition: all 0.3s ease;
  font-family: inherit;
}

.theme-dark .recipe-input {
  border-color: rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
}

.recipe-input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.theme-dark .recipe-input:focus {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.recipe-input::placeholder {
  color: rgba(0, 0, 0, 0.4);
  transition: color 0.3s ease;
}

.theme-dark .recipe-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.recipe-steps-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recipe-steps-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.recipe-steps-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
  margin: 0;
}

.theme-dark .recipe-steps-title {
  color: rgba(255, 255, 255, 0.85);
}

.recipe-add-step-button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  font-weight: 500;
  background-color: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  color: rgba(0, 0, 0, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.theme-dark .recipe-add-step-button {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.recipe-add-step-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.theme-dark .recipe-add-step-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

.recipe-add-step-button:active {
  transform: translateY(0);
}

.recipe-steps-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recipe-step-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.recipe-step-number {
  min-width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.7);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.theme-dark .recipe-step-number {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.recipe-step-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.9);
  color: rgba(0, 0, 0, 0.85);
  transition: all 0.3s ease;
  font-family: inherit;
}

.theme-dark .recipe-step-input {
  border-color: rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.85);
}

.recipe-step-input:focus {
  outline: none;
  border-color: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.theme-dark .recipe-step-input:focus {
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.recipe-step-input::placeholder {
  color: rgba(0, 0, 0, 0.4);
  transition: color 0.3s ease;
}

.theme-dark .recipe-step-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.recipe-remove-step-button {
  min-width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 300;
  color: rgba(220, 53, 69, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 0;
  line-height: 1;
}

.recipe-remove-step-button:hover {
  background-color: rgba(220, 53, 69, 0.2);
  border-color: rgba(220, 53, 69, 0.5);
  color: rgba(220, 53, 69, 1);
  transform: scale(1.1);
}

.recipe-remove-step-button:active {
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .recipe-container {
    padding: 1rem;
  }

  .recipe-title {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  .recipe-steps-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .recipe-step-item {
    gap: 0.75rem;
  }

  .recipe-step-number {
    min-width: 2rem;
    height: 2rem;
    font-size: 0.9rem;
  }

  .recipe-remove-step-button {
    min-width: 1.75rem;
    height: 1.75rem;
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .recipe-container {
    padding: 0.75rem;
  }

  .recipe-title {
    font-size: 1.75rem;
    margin-bottom: 1.25rem;
  }

  .recipe-label {
    font-size: 1rem;
  }

  .recipe-input,
  .recipe-step-input {
    font-size: 0.95rem;
    padding: 0.625rem 0.875rem;
  }
}
```

## Setup Instructions

### 1. Create the component files

- Create `src/pages/Recipe.tsx` with the component code above
- Create `src/pages/Recipe.css` with the styles above

### 2. Update your routing

Add the Recipe route to your router (e.g., in `App.tsx` or your router file):

```tsx
import Recipe from './pages/Recipe'

// In your Routes:
<Route path="/recipe" element={<Recipe />} />
```

### 3. Layout Component

**Note:** This component uses a `Layout` component wrapper. You'll need to either:

- **Option A:** Replace `<Layout>` with your own layout component or a simple `<div>`
- **Option B:** Create a simple Layout component that wraps children

Example simple Layout replacement:

```tsx
// Replace this:
<Layout>
  <div className="recipe-container">
    ...
  </div>
</Layout>

// With this:
<div className="recipe-container">
  ...
</div>
```

### 4. Theme Support (Optional)

The CSS includes dark theme support using `.theme-dark` class. If you don't have theme support:

- Remove all `.theme-dark` CSS rules, or
- Keep them for future theme implementation

### 5. Customization

- **Styling:** Adjust colors, spacing, and fonts in `Recipe.css` to match your design system
- **Functionality:** Extend the component to add:
  - Ingredients list
  - Recipe images
  - Save/load functionality
  - Recipe sharing
  - Timer functionality
  - etc.

## Features

- ✅ Recipe title input
- ✅ Dynamic step management (add/remove steps)
- ✅ Numbered step indicators
- ✅ Responsive design (mobile-friendly)
- ✅ Dark theme support
- ✅ Accessible (ARIA labels, semantic HTML)
- ✅ Clean, modern UI

## API Integration

### USDA FoodData Central

The Recipe app will use the [USDA FoodData Central API](https://fdc.nal.usda.gov/) to provide nutritional information for ingredients and recipes.

**API Details:**
- **Base URL:** https://fdc.nal.usda.gov/
- **Documentation:** https://fdc.nal.usda.gov/api-guide.html
- **API Key:** Required (get one at https://fdc.nal.usda.gov/api-key-signup.html)
- **License:** Public domain (CC0 1.0) - no permission needed, but attribution requested

**Use Cases:**
- Look up nutritional data for ingredients
- Calculate total nutritional values for recipes
- Display macro and micronutrient information
- Provide ingredient search and autocomplete

**Data Types Available:**
- Foundation Foods (analytical data, updated twice annually)
- SR Legacy Foods (historical data)
- Survey Foods (FNDDS) - applied to NHANES data
- Experimental Foods (peer-reviewed research)
- Branded Foods (commercial food products, updated monthly)

**Suggested Citation:**
> U.S. Department of Agriculture, Agricultural Research Service, Beltsville Human Nutrition Research Center. FoodData Central. [Internet]. [cited (enter date)]. Available from https://fdc.nal.usda.gov/.

### FatSecret Platform API

The Recipe app should also consider using the [FatSecret Platform API](https://platform.fatsecret.com/api-editions) as an alternative or complementary data source for food and nutrition information.

**API Details:**
- **Base URL:** https://platform.fatsecret.com/
- **Documentation:** https://platform.fatsecret.com/api-editions
- **API Key:** Required (sign up at https://platform.fatsecret.com/register)
- **License:** Commercial API with free and paid tiers

**Available Editions:**

1. **Basic Edition (Free)**
   - 5,000 API calls/day
   - US dataset only
   - Requires attribution
   - Self sign-up available

2. **Premier Free Edition**
   - Unlimited API calls
   - US dataset only
   - Free for startups, non-profits, and students
   - Requires verification/application
   - Requires attribution

3. **Premier Business/Enterprise Edition**
   - Unlimited API calls
   - Access to 56+ country datasets
   - 24 languages supported
   - White label (no attribution required)
   - SLA with guaranteed uptime
   - Contact for pricing

**Key Features:**
- Auto-complete food search
- Barcode scanning (UPC/EAC)
- Image recognition (optional add-on)
- Natural Language Processing (optional add-on)
- Recipe/meal builder and nutritional analysis
- Complete food and exercise diaries
- Weight tracking for diet programs
- Global recipe database (17,000+ recipes with images, directions, ingredients)
- Allergens and dietary preferences
- Food images
- Advanced food and brand categorization
- Caching support

**Use Cases:**
- Food search with autocomplete
- Barcode scanning for packaged foods
- Recipe database access
- Nutritional analysis and meal planning
- Image recognition for food identification
- Multi-language support for international users

**Eligibility for Premier Free:**
- Startups earning less than $1M annually with less than $1M in funding
- Non-profit organizations
- Students and student research groups

**Note:** Consider FatSecret as a complement to USDA FoodData Central, especially for:
- Branded food products
- International food databases
- Recipe collections
- Barcode scanning capabilities
- Image recognition features

## Dependencies

- React (with hooks: `useState`)
- TypeScript (optional, but recommended)
- CSS for styling
- USDA FoodData Central API (for nutritional data)
- FatSecret Platform API (optional, for enhanced features like barcode scanning, recipes, and international data)

No external libraries required for basic functionality!

