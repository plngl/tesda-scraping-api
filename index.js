const express = require('express');
const bodyParser = require('body-parser');
const { scrapeTESDA } = require('./playwright-script'); // Import the scraping function

const app = express();
const PORT = process.env.PORT || 3000;  // Use environment variable for the port

// Middleware to parse JSON requests
app.use(bodyParser.json());

// ✅ Root route for health check (API is live)
app.get('/', (req, res) => {
    res.status(200).send('✅ TESDA API is live!');
});

// ✅ POST /scrape to trigger scraping
app.post('/search', async (req, res) => {
    const { lastName, firstName, certFirstFour, certLastFour } = req.body;

    // Validate input fields
    if (!lastName || !firstName || !certFirstFour || !certLastFour) {
        return res.status(400).json({ 
            success: false, 
            message: 'All fields are required (lastName, firstName, certFirstFour, certLastFour).' 
        });
    }

    try {
        // Scrape data using the provided input
        const result = await scrapeTESDA(lastName, firstName, certFirstFour, certLastFour);

        if (result.success) {
            // Successfully retrieved data
            return res.status(200).json({
                success: true,
                message: 'Data retrieved successfully!',
                data: result.data || null // Return null if no data is found
            });
        } else {
            // Data not found for provided certificate
            return res.status(404).json({
                success: false,
                message: 'No data found for the provided certificate.',
                data: null
            });
        }
    } catch (error) {
        // Log detailed error for server-side debugging
        console.error('Error during scraping:', error);

        // Return a 500 status code for server errors
        return res.status(500).json({
            success: false,
            message: 'Internal server error. Please try again later.',
            error: error.message || 'Unknown error'
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});