const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const token = process.env.BOT_TOKEN;
// URL твоего приложения на Render (например, https://my-shop.onrender.com)
const url = process.env.RENDER_EXTERNAL_URL; 

// Создаем бота БЕЗ polling
const bot = new TelegramBot(token);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Устанавливаем Webhook
bot.setWebHook(`${url}/bot${token}`);

// Маршрут для получения обновлений от Telegram
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Логика создания счета (Stars)
app.post('/create-stars-invoice', async (req, res) => {
    const { item, userId } = req.body;
    try {
        const invoiceLink = await bot.createInvoiceLink(
            "Подарок", 
            `Покупка ${item}`, 
            `payload_${userId}_${Date.now()}`, 
            "", 
            "XTR", 
            [{ label: "Подарок", amount: 15 }]
        );
        res.json({ invoice_link: invoiceLink });
    } catch (e) {
        res.status(500).json({ error: "Ошибка" });
    }
});

bot.on('pre_checkout_query', (query) => bot.answerPreCheckoutQuery(query.id, true));
bot.on('successful_payment', (msg) => {
    bot.sendMessage(msg.from.id, "Оплата получена! Спасибо!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
