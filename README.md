# NutriScan 🍏🔍

NutriScan is a fast and responsive Node.js web application that allows users to instantly access detailed nutritional information, ingredients, and environmental impact data for thousands of food products. Powered by the [Open Food Facts API](https://world.openfoodfacts.org/), NutriScan helps you make informed choices about your diet.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-blue)
![EJS](https://img.shields.io/badge/EJS-Views-red)

## ✨ Features

- **Barcode Scanning:** Instantly pull up product details by entering a food item's barcode.
- **Advanced Search:** Search the massive open database using keywords, categories, brands, or filter by specific Nutri-Score / NOVA grades.
- **Comprehensive Product Details:** 
  - Vivid imagery, allergen alerts, and full ingredient lists.
  - Interactive badges and tooltips explaining Nutri-Scores (A-E) and NOVA food processing grades (1-4).
- **Saved Scans (Favorites):** Save your frequently searched items locally to your browser (requires no account!).
- **Smart Caching:** Built-in 10-minute server-side caching to speed up recurring queries and respect the API's rate limits.
- **Engaging UI/UX:** A modern, visually rich interface with custom layout components, tooltips, and a friendly, dedicated error page.

## 🛠️ Tech Stack

- **Backend:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Templating:** EJS (Embedded JavaScript) with `express-ejs-layouts`
- **Frontend:** HTML5, Vanilla CSS (`styles.css`), Vanilla JavaScript
- **API Connection:** [Axios](https://axios-http.com/)

## 🚀 Getting Started

To run NutriScan locally on your machine, follow these steps:

### Prerequisites

You will need to have [Node.js](https://nodejs.org/en/download/) (v16.x or newer is recommended) and `npm` installed.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/nutriscan.git
   cd nutriscan
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   You can run the app directly with node:
   ```bash
   node index.js
   ```
   *Alternatively, if you have `nodemon` installed globally, you can run `nodemon index.js` for hot-reloading during development.*

4. **Open the app:**
   Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

## 📂 Project Structure

```text
├── index.js          # Main Express application, routes, and API logic
├── package.json      # Node.js dependencies
├── public/           # Static assets (stylesheets, client-side JS, images)
│   ├── css/
│   │   └── styles.css
│   └── img/
└── views/            # EJS template files
    ├── layouts/      # Main layout wrapper
    ├── partials/     # Header, navbar, and footer pieces
    ├── index.ejs     # Home/Search page
    ├── product.ejs   # Search results page
    ├── product_detail.ejs # Single product overview
    ├── favorites.ejs # Render saved items
    └── error.ejs     # Custom UI for 404/500 errors
```

## 🤝 Acknowledgments

Data provided by [Open Food Facts](https://world.openfoodfacts.org/), a global, open-source database of food products built by contributors around the world.
