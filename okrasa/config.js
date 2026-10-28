/* Налаштування квізу.
   api — URL веб-застосунку Google Apps Script (Deploy → Web app → URL, закінчується на /exec).
   bot — username Telegram-бота без @ (необов'язково: сервер підкаже сам).
   Якщо api порожній, квіз працює як прототип: без відправки, з прев'ю повідомлень. */
window.QUIZ_CONFIG = {
  api: 'https://script.google.com/macros/s/AKfycbzx2GhW72XMrIvDFn6sdr0R4S2kf2xVNSRRvUZGMIv7Df-mub7dpAHO-ZoEqdd8lOsGRw/exec',
  bot: 'o_krasa_bot'
};
