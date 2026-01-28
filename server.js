const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const token = process.env.BOT_TOKEN;
const url = process.env.RENDER_EXTERNAL_URL; 

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (url) {
    bot.setWebHook(`${url}/bot${token}`);
}

app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Эндпоинт создания счета
app.post('/create-stars-invoice', async (req, res) => {
    const { item, itemId, userId } = req.body;
    
    try {
        const invoiceLink = await bot.createInvoiceLink(
            `Покупка: ${item}`, 
            `Цифровой подарок для вашего профиля`, 
            `payload_user_${userId}_item_${itemId}`, // Информация для нас
            "", 
            "XTR", 
            [{ label: item, amount: 15 }]
        );
        res.json({ invoice_link: invoiceLink });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Ошибка создания инвойса" });
    }
});

// Подтверждение платежа
bot.on('pre_checkout_query', (q) => bot.answerPreCheckoutQuery(q.id, true));

// Финал оплаты
bot.on('successful_payment', (msg) => {
    const payload = msg.successful_payment.invoice_payload;
    const name = msg.from.first_name;
    
    bot.sendMessage(msg.from.id, `✅ ${name}, оплата прошла успешно! Ваш предмет зарегистрирован.`);
    console.log("ПЛАТЕЖ ПОЛУЧЕН:", payload);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`v0.2 ready on port ${PORT}`));