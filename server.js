const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const API_URL = 'https://p20kng.digamber.in/api/dbp/sql';
const API_KEY = 'pk_dbp_b1c9ce1e25f9e2864099d2cbd905d6c741e7';
const DB_NAME = 'dbp_2a051213';

// Database Run Function
async function runQuery(sqlQuery) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db: DB_NAME, key: API_KEY, sql: sqlQuery })
    });
    return await response.json();
}

// Generate API
app.post('/api/generate', async (req, res) => {
    try {
        const days = parseInt(req.body.days) || 3;
        const maxActivations = parseInt(req.body.maxActivations) || 1;
        const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        const licenseKey = `P2077-${rand()}-${rand()}`;

        const sqlQuery = `INSERT INTO licenses (license_key, status, max_activations, activation_count, expires_at) 
                          VALUES ('${licenseKey}', 'active', ${maxActivations}, 0, NOW() + INTERVAL '${days} days');`;
        
        await runQuery(sqlQuery);
        res.json({ success: true, key: licenseKey, days: days });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Dashboard API (Fixed the empty data issue)
app.get('/api/keys', async (req, res) => {
    try {
        const sqlQuery = `SELECT * FROM licenses ORDER BY created_at DESC;`;
        const data = await runQuery(sqlQuery);
        
        // Handling Digamber API response format properly
        let keysArray = [];
        if (Array.isArray(data)) keysArray = data;
        else if (data && Array.isArray(data.result)) keysArray = data.result;
        else if (data && Array.isArray(data.rows)) keysArray = data.rows;

        res.json({ success: true, keys: keysArray });
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch keys" });
    }
});

// Delete API
app.delete('/api/keys/:key', async (req, res) => {
    try {
        const keyToDelete = req.params.key;
        const sqlQuery = `DELETE FROM licenses WHERE license_key = '${keyToDelete}';`;
        await runQuery(sqlQuery);
        res.json({ success: true, message: "Deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Delete failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
