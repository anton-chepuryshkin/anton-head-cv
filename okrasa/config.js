/* Налаштування квізу.
   api — URL веб-застосунку Google Apps Script (Deploy → Web app → URL, закінчується на /exec).
   bot — username Telegram-бота без @ (необов'язково: сервер підкаже сам).
   Якщо api порожній, квіз працює як прототип: без відправки, з прев'ю повідомлень. */
window.QUIZ_CONFIG = {
  api: '',
  bot: ''
};
