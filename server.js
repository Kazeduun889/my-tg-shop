const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// Берем токен из переменных окружения (настроим в Render)
const token = process.env.BOT_TOKEN;

// Создаем экземпляр бота
// Используем polling: true для простоты (для небольших проектов это ок)
const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(express.json());

// Раздаем статические файлы из папки public (наш index.html)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Эндпоинт для создания ссылки на оплату (Telegram Stars)
 */
app.post('/create-stars-invoice', async (req, res) => {
    const { item, userId } = req.body;

    const title = "Подарок в магазине";
    const description = `Покупка товара "${item}" за 15 звезд`;
    const payload = `user_id_${userId}_item_${item}_${Date.now()}`; // Уникальный ID транзакции
    const currency = "XTR"; // Код валюты для Telegram Stars
    const prices = [{ label: "Подарок", amount: 15 }];

    try {
        // Генерируем ссылку на оплату через API Telegram
        const invoiceLink = await bot.createInvoiceLink(
            title, 
            description, 
            payload, 
            "", // provider_token для звезд всегда пустая строка
            currency, 
            prices
        );
        
        res.json({ invoice_link: invoiceLink });
    } catch (e) {
        console.error("Ошибка при создании инвойса:", e);
        res.status(500).json({ error: "Не удалось создать счет" });
    }
});

/**
 * Обработка процесса оплаты (Pre-checkout)
 * Telegram спрашивает: "Всё ли ок, можно ли принимать деньги?"
 */
bot.on('pre_checkout_query', (query) => {
    // Мы всегда отвечаем "да", так как товар цифровой и всегда в наличии
    bot.answerPreCheckoutQuery(query.id, true)
        .catch((err) => console.error("Ошибка pre_checkout:", err));
});

/**
 * Уведомление об успешной оплате
 */
bot.on('successful_payment', (msg) => {
    const userId = msg.from.id;
    const amount = msg.successful_payment.total_amount;
    const payload = msg.successful_payment.invoice_payload;

    console.log(`Пользователь ${userId} успешно оплатил ${amount} звезд! Payload: ${payload}`);

    // Отправляем сообщение пользователю в чат
    bot.sendMessage(userId, "Спасибо за покупку! Ваш подарок уже ждет вас.");
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});