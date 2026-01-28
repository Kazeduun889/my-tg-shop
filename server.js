const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const token = process.env.BOT_TOKEN;
// Если на Render не подхватится автоматически, замени эту строку на свою ссылку:
// const url = 'https://твой-адрес.onrender.com';
const url = process.env.RENDER_EXTERNAL_URL || ''; 

const bot = new TelegramBot(token);
const app = express();

app.use(express.json());

// ЛОГЕР: В консоли Render ты увидишь, какой путь запрашивает Telegram
app.use((req, res, next) => {
    console.log(`Запрос пришел: ${req.method} ${req.url}`);
    next();
});

// Отдаем статику из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Главная страница
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("ФАЙЛ НЕ НАЙДЕН ПО ПУТИ:", indexPath);
            res.status(404).send("Ошибка: Файл index.html не найден на сервере в папке public");
        }
    });
});

// Настройка Webhook (если есть URL)
if (url) {
    bot.setWebHook(`${url}/bot${token}`);
    console.log(`Webhook установлен на ${url}/bot${token}`);
} else {
    console.error("ВНИМАНИЕ: URL не задан, Webhook не будет работать!");
}

// Прием обновлений от бота
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Создание счета
app.post('/create-stars-invoice', async (req, res) => {
    const { item, userId } = req.body;
    try {
        const invoiceLink = await bot.createInvoiceLink(
            "Подарок", "Описание", `pay_${userId}`, "", "XTR", 
            [{ label: "Товар", amount: 15 }]
        );
        res.json({ invoice_link: invoiceLink });
    } catch (e) {
        console.error("Ошибка инвойса:", e);
        res.status(500).json({ error: e.message });
    }
});

bot.on('pre_checkout_query', (q) => bot.answerPreCheckoutQuery(q.id, true));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
