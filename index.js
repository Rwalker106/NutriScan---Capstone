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

// Function to set a custom User-Agent for all outgoing requests
async function offFetch(URL) {
    try {        
        const response = await axios.get(URL, {
                headers: {
                    'User-Agent': USER_AGENT,
        },
    });

        return response.data;
    } catch (err) {
    console.error("Open Food Facts error:", err.message);
    throw err;
    }
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
        fat: p.nutriments?.fat_100g || null,
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

    // Ingredients
    ingredients: p.ingredients_text || null,
    allergens: p.allergens || null,

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

    const barcodeURL = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    try {
        const response = await offFetch(barcodeURL);
        const product = normalizeProduct(response.product);
        res.render('product', { products:[product] }); // pass single product as an array to the template
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});
// Route for search by name
app.get('/search', async (req, res) => {
    const { name, nutriscore_grade, nova_group, brand, categories, labels } = req.query;
    const params = new URLSearchParams();
    if (name) params.append('name', name);
    if (nutriscore_grade) params.append('nutriscore_grade', nutriscore_grade);
    if (nova_group) params.append('nova_group', nova_group);
    if (brand) params.append('brands', brand);
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

    params.append('json', '1');
    params.append('fields', 'product_name,brands,nutriscore_grade,nutriments,image_front_url,ingredients_text,allergens,packaging,quantity,labels,categories,serving_size,code,nova_group');

    const searchURL = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`;
    
    try {
        const response = await offFetch(searchURL);
        const products = response.products.map(normalizeProduct);
        res.render('product', { products });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching data');
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});