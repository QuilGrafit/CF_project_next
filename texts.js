// texts.js
// Этот файл содержит все текстовые константы для разных языков.

const TEXTS = {
    ru: {
        welcome_message: "Привет! Добро пожаловать в CosmicForecast. Выберите действие:",
        get_horoscope: "🔮 Получить гороскоп",
        settings: "⚙️ Настройки",
        about_us: "ℹ️ О нас",
        ton_wallet: "💰 TON Кошелек",
        share_bot: "💌 Поделиться ботом",
        error_message: "Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз позже.",
        choose_sign: "Выберите ваш знак зодиака:",
        today: "На сегодня",
        tomorrow: "На завтра",
        week: "На неделю",
        month: "На месяц",
        year: "На год",
        back_to_main_menu: "◀️ Назад в главное меню",
        invalid_sign: "Неверный знак зодиака. Пожалуйста, выберите из меню.",
        choose_duration: "Выберите период:",
        invalid_duration: "Неверный период. Пожалуйста, выберите из меню.",
        unknown_command: "Я не понял вашу команду. Пожалуйста, выберите действие из меню.",
        // Добавьте любые другие тексты, которые использует ваш бот
        // Например:
        horoscope_for: "Гороскоп для", // Для вывода: Гороскоп для [Знака] [Периода]
        and_period: "", // Пустая строка или "на" / "за" для формирования фразы
    },
    en: {
        welcome_message: "Hello! Welcome to CosmicForecast. Choose an action:",
        get_horoscope: "🔮 Get Horoscope",
        settings: "⚙️ Settings",
        about_us: "ℹ️ About Us",
        ton_wallet: "💰 TON Wallet",
        share_bot: "💌 Share Bot",
        error_message: "An error occurred while processing your request. Please try again later.",
        choose_sign: "Choose your zodiac sign:",
        today: "Today",
        tomorrow: "Tomorrow",
        week: "This Week",
        month: "This Month",
        year: "This Year",
        back_to_main_menu: "◀️ Back to Main Menu",
        invalid_sign: "Invalid zodiac sign. Please choose from the menu.",
        choose_duration: "Choose a period:",
        invalid_duration: "Invalid period. Please choose from the menu.",
        unknown_command: "I didn't understand your command. Please choose an action from the menu.",
        horoscope_for: "Horoscope for",
        and_period: "", // e.g., "for" if you want "Horoscope for Aries for Today"
    }
};

export default TEXTS; // Экспортируем TEXTS как дефолтный экспорт
