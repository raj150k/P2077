const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// আপনার ডাটাবেসের আপডেট ক্রেডেনশিয়াল
const API_URL = 'https://p20kng.digamber.in/api/dbp/sql';
const API_KEY = 'pk_dbp_b1c9ce1e25f9e2864099d2cbd905d6c741e7';
const DB_NAME = 'dbp_2a051213';

// লাইসেন্স কি তৈরি করার মূল এপিআই
app.post('/api/generate', async (req, res) => {
    try {
        const days = parseInt(req.body.days) || 3; // ৩, ৭, ১৫, ৩০ দিন
        const maxActivations = parseInt(req.body.maxActivations) || 1;

        // P2077 ফরম্যাটে ইউনিক লাইসেন্স কি তৈরি (যেমন: P2077-A8F2-9X2L)
        const rand = () => Math.random().toString(36).substring(2, 6).toUpperCase();
        const licenseKey = `P2077-${rand()}-${rand()}`;

        // PostgreSQL Query: মেয়াদের জন্য NOW() + INTERVAL 'X days' ব্যবহার করা হয়েছে
        const sqlQuery = `
            INSERT INTO licenses (license_key, status, max_activations, activation_count, expires_at) 
            VALUES ('${licenseKey}', 'active', ${maxActivations}, 0, NOW() + INTERVAL '${days} days');
        `;

        // HTTP API দিয়ে ডাটাবেসে রিকোয়েস্ট পাঠানো
        const dbResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                db: DB_NAME,
                key: API_KEY,
                sql: sqlQuery
            })
        });

        const result = await dbResponse.json();

        // সাফল্য চেক
        if (dbResponse.ok) {
            res.json({ success: true, key: licenseKey, days: days });
        } else {
            res.status(400).json({ success: false, message: result.error || "Database rejection" });
        }

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ success: false, message: "Server Database Connection Failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
