// lib/Keyboard.js
const Keyboard = {
    main_menu: () => {
        return {
            reply_markup: {
                keyboard: [
                    [{ text: '🌟 Get Horoscope' }],
                    [{ text: '⚙️ Settings' }, { text: '💎 Premium' }]
                ],
                resize_keyboard: true
            }
        };
    },
    donate_menu: () => {
        return {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '💸 Donate us', callback_data: 'donate_us' }],
                    [{ text: '📢 Buy Ads', callback_data: 'buy_ads' }]
                ]
            }
        };
    }
    // ... другие клавиатуры
};

export default Keyboard;
