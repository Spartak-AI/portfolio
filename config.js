/* SPARTAK LAB — все данные сайта в одном месте.
   Новый кейс = ещё один объект в списке `casos`: карточка, пункт в «Нишах»
   и вариант в форме появятся сами. */
window.SITE = {
  nome: "SPARTAK LAB",

  // Новый первый экран (человек и шар из сайтов). false — вернуть старый экран с веером окон.
  heroNovo: true,

  whatsapp: {
    numero: "77075434328",
    mensagem: "Здравствуйте! Хочу себе такой же сайт.",
  },

  casos: [
    {
      id: "house",
      nome: "VELLOR",
      nicho: "Строительство домов",
      nichoCurto: "Стройка",
      url: "https://spartak-ai.github.io/vellor/",
      video: "assets/cases/house.mp4",
      poster: "assets/cases/house.jpg",
      jtbd: "Построить дом для семьи и не застрять на годы со стройкой, которая вышла за смету.",
      cjm: "Сомнение «а не бросят ли на полпути». Сайт показывает стройку по этапам и что фиксируется в договоре.",
    },
    {
      id: "kitchen",
      nome: "DASTAR",
      nicho: "Кухни на заказ",
      nichoCurto: "Кухни",
      url: "https://spartak-ai.github.io/dastar/",
      video: "assets/cases/kitchen.mp4",
      poster: "assets/cases/kitchen.jpg",
      jtbd: "Получить кухню под свои размеры и привычки, а не подгонять жизнь под стандартные модули.",
      cjm: "Вопрос «сколько это будет стоить». Сайт отвечает готовыми проектами с ценой и калькулятором.",
    },
    {
      id: "auto",
      nome: "AUTOBRIDGE",
      nicho: "Подбор и привоз авто из Кореи и Китая",
      nichoCurto: "Авто",
      url: "https://spartak-ai.github.io/autobridge/",
      video: "assets/cases/auto.mp4",
      poster: "assets/cases/auto.jpg",
      jtbd: "Купить машину дешевле, чем у местного дилера, и не нарваться на битый кузов и скрытые платежи.",
      cjm: "Страх обмана перед предоплатой. Сайт раскладывает подбор по шагам и считает цену под ключ.",
    },
    {
      id: "logistic",
      nome: "NEXO LOGISTICS",
      nicho: "Грузоперевозки",
      nichoCurto: "Логистика",
      url: "https://spartak-ai.github.io/nexo/",
      video: "assets/cases/logistic.mp4",
      poster: "assets/cases/logistic.jpg",
      jtbd: "Отправить груз так, чтобы он пришёл в срок, и не звонить диспетчеру каждый день.",
      cjm: "Выбор «кому доверить груз». Сайт показывает маршруты, склады и сразу ведёт к расчёту.",
    },
    {
      id: "burger",
      nome: "KÖMIR",
      nicho: "Бургерная",
      nichoCurto: "Еда",
      url: "https://spartak-ai.github.io/komir/",
      video: "assets/cases/burger.mp4",
      poster: "assets/cases/burger.jpg",
      jtbd: "Быстро заказать сытный бургер с доставкой или забрать по дороге.",
      cjm: "Путь от «хочу есть» до заказа. Корзина на сайте собирает заказ и отправляет его в WhatsApp.",
    },
    {
      id: "coffee",
      nome: "TAŃ coffee",
      nicho: "Кофейня",
      nichoCurto: "Кофе",
      url: "https://spartak-ai.github.io/tan/",
      video: "assets/cases/coffee.mp4",
      poster: "assets/cases/coffee.jpg",
      jtbd: "Найти рядом место с хорошим кофе, куда хочется вернуться.",
      cjm: "Вопрос «где это и стоит ли идти». Сайт показывает зерно, меню, атмосферу и маршрут.",
    },
  ],
};
