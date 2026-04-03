import express from 'express';
import axios from 'axios';
import ejs from 'ejs';
import expressEjsLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 

const app = express();
const PORT = 3000;  
const app_name = 'NutriScan';
const app_version = '0.0.1';
const contact_info = 'rwalker106@icloud.com';
const USER_AGENT  = `${app_name}/${app_version} (${contact_info})`;

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Set the directory for EJS templates
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies (for API requests)
app.use(express.json());

// Use express-ejs-layouts for layout support
app.use(expressEjsLayouts);
app.set('layout', 'layouts/main'); // Set the default layout file (views/layouts/main.ejs)  

// Simple in-memory cache
const apiCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Function to set a custom User-Agent for all outgoing requests
async function offFetch(URL) {
    if (apiCache.has(URL)) {
        const cached = apiCache.get(URL);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            console.log("Cache Hit!");
            return cached.data;
        } else {
            apiCache.delete(URL);
        }
    }

    try {        
        const response = await axios.get(URL, {
                headers: {
                    'User-Agent': USER_AGENT,
        },
    });

        apiCache.set(URL, {
            data: response.data,
            timestamp: Date.now()
        });

        return response.data;
    } catch (err) {
        console.error("Open Food Facts error:", err.message);
        throw err;
    }
}

// Function to extract region from cookie or Accept-Language header
function getRegion(req) {
    // 1. Check for manual override cookie
    const cookies = req.headers.cookie;
    if (cookies) {
        const match = cookies.match(/(?:^| )off_region=([^;]+)/);
        if (match && match[1]) return match[1];
    }
    
    // 2. Fallback to Accept-Language header (e.g. "en-US,en;q=0.9")
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
        let match;
        // Search for region code (2 letters following a dash, ignoring quality score)
        const regex = /[a-zA-Z]{2}-([a-zA-Z]{2})/g;
        if ((match = regex.exec(acceptLang)) !== null) {
            return match[1].toLowerCase(); // E.g., 'us' from 'en-US'
        }
    }
    
    return 'world'; // Default global database
}

// Function to normalize product data from OpenFoodFacts API
function normalizeProduct(p) {
    return {
    code: p.code || null,
    name: p.product_name || "Unnamed product",
    brand: p.brands || "Unknown",
    labels: p.labels || null,
    quantity: p.quantity || null,

    // Images
    image: p.image_front_url || "/img/no-image.png",

    // Nutrition
    nutriments: {
        calories: p.nutriments?.energy_kcal_100g || null,
        carbs: p.nutriments?.carbohydrates_100g || null,
        fat: p.nutriments?.fat_100g || null,
        saturatedFat: p.nutriments?.['saturated-fat_100g'] || null,
        sugar: p.nutriments?.sugars_100g || null,
        salt: p.nutriments?.salt_100g || null,
        protein: p.nutriments?.proteins_100g || null,
        fiber: p.nutriments?.fiber_100g || null,
        vitamins: {
            a: p.nutriments?.vitamin_a_100g || null,
            c: p.nutriments?.vitamin_c_100g || null,
            d: p.nutriments?.vitamin_d_100g || null,
            e: p.nutriments?.vitamin_e_100g || null,
            k: p.nutriments?.vitamin_k_100g || null,
        },
        servingSize: p.serving_size || null,
    },

    // Scores
    nutriScore: p.nutriscore_grade || null,
    nova: p.nova_group || null,
    ecoScore: p.ecoscore_grade || null,

    // Ingredients
    ingredients: p.ingredients_text || null,
    allergens: p.allergens || null,
    traces: p.traces || null,
    additives: p.additives_tags || null,
    dietary: p.ingredients_analysis_tags || null,

    // Packaging
    packaging: p.packaging || null,
    categories: p.categories || null,

    };
}

// Route for the home page
app.get('/', async (req, res) => {
    res.render('index');
});

// Route for barcode search
app.get('/product/:barcode', async (req, res) => {
    const {barcode} = req.params;
    const region = getRegion(req);

    const barcodeURL = `https://${region}.openfoodfacts.org/api/v0/product/${barcode}.json`;
    try {
        const response = await offFetch(barcodeURL);
        const product = normalizeProduct(response.product);
        res.render('product_detail', { product });
    } catch (error) {
        console.error("Barcode search error:", error.message);
        res.status(500).render('error', {
            title: 'Product Not Found',
            message: 'We could not fetch data for this barcode. Make sure the barcode is correct or try another one.',
            status: 500
        });
    }
});
// Route for search by name
app.get('/search', async (req, res) => {
    // Both 'query' (main search) and 'name' (filter search) maps to search_terms
    // The filter search form uses 'brands', not 'brand'
    const { query, name, nutriscore_grade, nova_group, brands, categories, labels } = req.query;
    
    let page = parseInt(req.query.page) || 1;
    if (page < 1) page = 1;

    const params = new URLSearchParams();
    
    const searchTerms = query || name;
    if (searchTerms) params.append('search_terms', searchTerms);
    
    if (nutriscore_grade) params.append('nutriscore_grade', nutriscore_grade);
    if (nova_group) params.append('nova_group', nova_group);
    if (brands) params.append('brands', brands);
    // If single value: req.query.categories = 'snacks'
    // If multiple values: req.query.categories = ['snacks', 'dairy']
    if (categories) {
        const categoriesArray = categories.split(',').map(cat => cat.trim());
        params.append('categories_tags', categoriesArray.join(','));
    }
    if (labels) {
        const labelsArray = labels.split(',').map(label => label.trim());
        params.append('labels_tags', labelsArray.join(','));
    }

    params.append('action', 'process');
    params.append('json', '1');
    params.append('page_size', '15'); // Limit results to prevent 503 timeouts from OFF
    params.append('page', page.toString());
    params.append('fields', 'product_name,brands,nutriscore_grade,nutriments,image_front_url,ingredients_text,allergens,packaging,quantity,labels,categories,serving_size,code,nova_group,ecoscore_grade');

    const region = getRegion(req);
    const searchURL = `https://${region}.openfoodfacts.org/cgi/search.pl?${params.toString()}`;
    
    try {
        const response = await offFetch(searchURL);
        
        const qsParams = new URLSearchParams(req.query);
        qsParams.delete('page');
        const basePath = '/search?' + qsParams.toString();

        if (!response.products) {
            console.error('No products array in response from API.');
            return res.render('product', { products: [], page, basePath });
        }
        
        const products = response.products.map(normalizeProduct);
        res.render('product', { products, page, basePath });
    } catch (error) {
        console.error("Search API error:", error.message);
        res.status(500).render('error', {
            title: 'Search Failed',
            message: 'We encountered an error while searching the food database. Please check your spelling and try again.',
            status: 500
        });
    }
});

// Route for favorites page
app.get('/favorites', (req, res) => {
    res.render('favorites');
});

// 404 handler for unknown routes
app.use((req, res, next) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        message: 'The page you are looking for has vanished into the digital supermarket aisle. Check the URL and try again.',
        status: 404
    });
});

// General error handler
app.use((err, req, res, next) => {
    console.error("Global error handler:", err.stack);
    res.status(500).render('error', {
        title: 'Unexpected Error',
        message: 'Something broke in our kitchen. We are cleaning up the mess!',
        status: 500
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});