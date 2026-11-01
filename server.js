const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const API_URL = 'https://p20kng.digamber.in/api/dbp/sql';
const API_KEY = 'pk_dbp_b1c9ce1e25f9e2864099d2cbd905d6c741e7';
const DB_NAME = 'dbp_2a051213';

// Helper function for Database Query
async function runQuery(sqlQuery) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db: DB_NAME, key: API_KEY, sql: sqlQuery })
    });
    return await response.json();
}

// ১. আগের Generate API (হুবহু এক)
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
        res.status(500).json({ success: false, message: "Database Connection Failed" });
    }
});

// ২. ড্যাশবোর্ডের জন্য সব Key আনার API (নতুন)
app.get('/api/keys', async (req, res) => {
    try {
        const sqlQuery = `SELECT * FROM licenses ORDER BY created_at DESC;`;
        const data = await runQuery(sqlQuery);
        res.json({ success: true, keys: data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch keys" });
    }
});

// ৩. ডাটাবেস থেকে Key ডিলিট করার API (নতুন)
app.delete('/api/keys/:key', async (req, res) => {
    try {
        const keyToDelete = req.params.key;
        const sqlQuery = `DELETE FROM licenses WHERE license_key = '${keyToDelete}';`;
        await runQuery(sqlQuery);
        res.json({ success: true, message: "Key Deleted Successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete key" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
