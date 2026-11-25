// Copie des questions-réponses de l'accueil (src/lib/translations.ts « faqItems » et
// src/lib/uiTranslations/), servie aux robots avec le résultat enrichi FAQPage.
// Les fichiers de api/ ne lisent pas src/ : le test src/config/seoFaq.test.ts vérifie
// que cette copie reste identique au site. Le texte entre [crochets] est un lien sur le site.
import type { PageLang } from "./site.js";

export type FaqItem = { q: string; a: string[] };

export const HOME_FAQ: Record<PageLang, FaqItem[]> ={
  "en": [
    {
      "q": "Why book through STAYMAKOM?",
      "a": [
        "STAYMAKOM is more than a hotel booking platform. We combine handpicked hotels with curated experiences in one seamless reservation, making it easier, more inspiring, and more effortless to plan your stay.",
        "Instead of spending hours searching for where to stay, what to do, and how to organize everything separately, STAYMAKOM brings everything together in one place. Our packages are designed to offer a smoother and more advantageous experience than booking each element individually."
      ]
    },
    {
      "q": "Where are your experiences available?",
      "a": [
        "We are currently focused on Israel, with experiences across Tel Aviv, Jerusalem, and many more destinations waiting to be discovered. Israel has so much more to offer beyond the usual routes, with a wide variety of places, atmospheres, and experiences across the country. We're continuously adding new destinations and inviting travelers to discover a different side of Israel."
      ]
    },
    {
      "q": "Can I book an experience without staying overnight?",
      "a": [
        "Yes. You can now book experiences on their own or as part of a hotel stay. Whether you're looking for a unique activity, a complete getaway, or both, STAYMAKOM lets you choose the option that suits your plans.",
        "Some experiences include exclusive benefits or special rates when booked together with a hotel, while others can be enjoyed independently."
      ]
    },
    {
      "q": "Who are these experiences for?",
      "a": [
        "STAYMAKOM is designed both for travelers visiting Israel and for locals looking to experience the country differently. Whether it's your first time discovering Israel or you've been spending every summer here for years, STAYMAKOM helps you explore beyond the usual plans and discover experiences you might not have found otherwise."
      ]
    },
    {
      "q": "Do I need to plan everything myself?",
      "a": [
        "No, that's exactly the point. Each experience is already thoughtfully designed for you, so you don't have to spend hours researching, coordinating, or booking multiple services separately. You simply choose, book, and enjoy."
      ]
    },
    {
      "q": "Is it suitable for a special occasion?",
      "a": [
        "Yes, our experiences are perfect for celebrating a special moment or simply taking time for yourself. If you have something specific in mind, you can also [submit a request] to design a fully tailored experience."
      ]
    },
    {
      "q": "What if I want something more personalized?",
      "a": [
        "If you're looking for something more specific, you can submit a request through our [Tailor-Made form]. We'll help you create a more personalized experience based on your occasion, preferences, and travel style."
      ]
    },
    {
      "q": "Can I cancel or modify my booking?",
      "a": [
        "Yes, cancellation and modification policies are clearly displayed before you confirm your booking. We work closely with our hotel partners to offer flexible conditions so you can book with confidence. You can also easily manage your booking directly from your customer account."
      ]
    }
  ],
  "fr": [
    {
      "q": "Pourquoi réserver via STAYMAKOM ?",
      "a": [
        "STAYMAKOM, c'est bien plus qu'une plateforme de réservation d'hôtels. Nous combinons des hôtels soigneusement sélectionnés avec des expériences uniques, en une seule réservation simple, pour que votre séjour soit facile, inspirant et sans prise de tête.",
        "Au lieu de passer des heures à chercher, planifier et coordonner chaque élément séparément, tout est déjà réuni au même endroit. Nos formules sont pensées pour offrir une expérience plus fluide et plus avantageuse qu'une réservation à la carte."
      ]
    },
    {
      "q": "Où sont disponibles vos expériences ?",
      "a": [
        "Nous nous concentrons actuellement sur Israël, avec des expériences à Tel Aviv, Jérusalem et de nombreuses autres destinations qui n'attendent qu'à être découvertes. Israël a bien plus à offrir que les circuits habituels : une richesse de lieux, d'ambiances et de sensations à travers tout le pays. Nous enrichissons continuellement notre catalogue et invitons les voyageurs à découvrir un Israël autrement."
      ]
    },
    {
      "q": "Puis-je réserver une expérience sans passer la nuit à l'hôtel ?",
      "a": [
        "Oui. Vous pouvez désormais réserver une expérience seule ou l'associer à un séjour à l'hôtel. Que vous recherchiez simplement une activité, une escapade complète ou les deux, STAYMAKOM vous laisse choisir l'option qui correspond le mieux à vos envies.",
        "Certaines expériences proposent des avantages exclusifs ou des tarifs préférentiels lorsqu'elles sont réservées avec un hôtel, tandis que d'autres sont disponibles indépendamment."
      ]
    },
    {
      "q": "À qui s'adressent ces expériences ?",
      "a": [
        "STAYMAKOM s'adresse aussi bien aux voyageurs qui découvrent Israël qu'aux locaux qui souhaitent vivre leur pays autrement. Que ce soit votre première fois en Israël ou que vous y passiez chaque été depuis des années, STAYMAKOM vous aide à explorer au-delà des sentiers battus et à vivre des expériences que vous n'auriez peut-être pas trouvées autrement."
      ]
    },
    {
      "q": "Dois-je tout organiser moi-même ?",
      "a": [
        "Non, et c'est justement l'idée. Chaque expérience est déjà pensée et préparée pour vous, sans avoir à passer des heures à chercher, coordonner ou réserver plusieurs services séparément. Il suffit de choisir, réserver et profiter."
      ]
    },
    {
      "q": "Est-ce adapté à une occasion spéciale ?",
      "a": [
        "Absolument. Nos expériences sont parfaites pour marquer un moment unique ou simplement prendre du temps pour soi. Si vous avez quelque chose de particulier en tête, vous pouvez aussi [soumettre une demande] pour créer une expérience entièrement sur mesure."
      ]
    },
    {
      "q": "Et si je veux quelque chose de plus personnalisé ?",
      "a": [
        "Si vous cherchez quelque chose de plus spécifique, vous pouvez soumettre une demande via notre [formulaire sur mesure]. Nous vous aiderons à créer une expérience adaptée à votre occasion, vos préférences et votre style de voyage."
      ]
    },
    {
      "q": "Puis-je annuler ou modifier ma réservation ?",
      "a": [
        "Oui, les conditions d'annulation et de modification sont clairement indiquées avant de confirmer votre réservation. Nous travaillons en étroite collaboration avec nos hôtels partenaires pour proposer des conditions flexibles, afin que vous puissiez réserver en toute confiance. Vous pouvez également gérer facilement votre réservation directement depuis votre espace client."
      ]
    }
  ],
  "he": [
    {
      "q": "למה להזמין דרך STAYMAKOM?",
      "a": [
        "STAYMAKOM היא הרבה יותר מפלטפורמת הזמנת מלונות. אנחנו משלבים מלונות נבחרים עם חוויות ייחודיות בהזמנה אחת פשוטה, כדי להפוך את החופשה שלכם לקלה, מעוררת השראה וללא התעסקות מיותרת.",
        "במקום לבזבז זמן על חיפוש, תכנון ותיאומים, הכל כבר מחכה לכם במקום אחד. החבילות שלנו נועדו להציע חוויה חלקה ומשתלמת יותר מהזמנה נפרדת של כל מרכיב."
      ]
    },
    {
      "q": "איפה החוויות זמינות?",
      "a": [
        "אנחנו כרגע מתמקדים בישראל, עם חוויות בתל אביב, ירושלים ויעדים רבים נוספים שממתינים לגילוי. לישראל יש הרבה יותר להציע מעבר למסלולים הרגילים: מגוון עשיר של מקומות, אווירות וחוויות לאורך כל הארץ. אנחנו ממשיכים להוסיף יעדים חדשים ומזמינים מטיילים לגלות צד אחר של ישראל."
      ]
    },
    {
      "q": "האם אפשר להזמין חוויה בלי לינה במלון?",
      "a": [
        "כן. עכשיו אפשר להזמין חוויה בפני עצמה או כחלק משהות במלון.",
        "בין אם אתם מחפשים פעילות מיוחדת, חופשה מלאה או שילוב של השניים – ב-STAYMAKOM תוכלו לבחור את האפשרות שמתאימה לכם.",
        "חלק מהחוויות כוללות הטבות או מחירים מיוחדים כאשר מזמינים אותן יחד עם מלון, בעוד שאחרות זמינות גם כהזמנה נפרדת."
      ]
    },
    {
      "q": "למי החוויות מתאימות?",
      "a": [
        "STAYMAKOM מיועדת הן למטיילים המגיעים לישראל והן למקומיים שרוצים לחוות את הארץ אחרת. בין אם זו הפעם הראשונה שאתם מגלים את ישראל, ובין אם אתם מבלים כל קיץ כאן כבר שנים, STAYMAKOM עוזרת לכם לחקור מעבר לתוכניות הרגילות ולגלות חוויות שאולי לא הייתם מוצאים בדרך אחרת."
      ]
    },
    {
      "q": "האם צריך לתכנן הכל לבד?",
      "a": [
        "לא, וזה בדיוק הרעיון. כל חוויה כבר נבנתה ותוכננה עבורכם, כך שאין צורך להשקיע שעות בחיפושים, תיאומים או הזמנות נפרדות. פשוט בוחרים, מזמינים ונהנים."
      ]
    },
    {
      "q": "האם זה מתאים לאירוע מיוחד?",
      "a": [
        "בהחלט. החוויות שלנו מושלמות לחגיגת רגע מיוחד או פשוט כדי לקחת זמן לעצמכם. אם יש לכם בקשה מסוימת, תוכלו גם [לשלוח פנייה] ליצירת חוויה מותאמת אישית."
      ]
    },
    {
      "q": "מה אם אני רוצה משהו יותר מותאם אישית?",
      "a": [
        "אם אתם מחפשים חוויה ספציפית יותר, תוכלו למלא את [טופס ה-Tailor-Made] שלנו. נעזור לכם ליצור חוויה מותאמת אישית לפי האירוע, ההעדפות וסגנון הטיול שלכם."
      ]
    },
    {
      "q": "אפשר לבטל או לשנות את ההזמנה?",
      "a": [
        "כן, תנאי הביטול והשינוי מוצגים בצורה ברורה לפני אישור ההזמנה. אנחנו עובדים בשיתוף פעולה עם שותפי המלון שלנו כדי להציע תנאים גמישים, שיאפשרו לכם להזמין בביטחון. ניתן גם לנהל את ההזמנה בקלות ישירות מחשבון הלקוח שלכם."
      ]
    }
  ],
  "es": [
    {
      "q": "¿Por qué reservar con STAYMAKOM?",
      "a": [
        "STAYMAKOM es mucho más que una plataforma de reservas de hotel. Combinamos hoteles seleccionados con experiencias elegidas con cuidado en una sola reserva, para que planificar tu estancia sea más fácil, más inspirador y sin complicaciones.",
        "En lugar de pasar horas buscando dónde alojarte, qué hacer y cómo organizarlo todo por separado, en STAYMAKOM lo tienes todo en un solo lugar. Nuestros paquetes están pensados para ofrecer una experiencia más fluida y ventajosa que reservar cada elemento por tu cuenta."
      ]
    },
    {
      "q": "¿Dónde están disponibles las experiencias?",
      "a": [
        "Por ahora nos centramos en Israel, con experiencias en Tel Aviv, Jerusalén y muchos otros destinos por descubrir. Israel tiene mucho más que ofrecer que las rutas de siempre: una gran variedad de lugares, ambientes y experiencias por todo el país. Seguimos sumando nuevos destinos e invitamos a los viajeros a descubrir otra cara de Israel."
      ]
    },
    {
      "q": "¿Puedo reservar una experiencia sin pasar la noche en un hotel?",
      "a": [
        "Sí. Ahora puedes reservar experiencias por separado o como parte de una estancia en hotel. Tanto si buscas una actividad única como una escapada completa, o ambas cosas, STAYMAKOM te permite elegir la opción que mejor encaja con tus planes.",
        "Algunas experiencias incluyen ventajas exclusivas o tarifas especiales si las reservas junto con un hotel, mientras que otras se pueden disfrutar por sí solas."
      ]
    },
    {
      "q": "¿Para quién son estas experiencias?",
      "a": [
        "STAYMAKOM está pensado tanto para quienes visitan Israel como para quienes viven aquí y quieren conocer el país de otra manera. Tanto si es tu primera vez en Israel como si llevas años pasando aquí cada verano, STAYMAKOM te ayuda a ir más allá de los planes de siempre y a descubrir experiencias que quizá no habrías encontrado por tu cuenta."
      ]
    },
    {
      "q": "¿Tengo que organizarlo todo yo?",
      "a": [
        "No, esa es justamente la idea. Cada experiencia ya está pensada con cuidado para ti, así que no tienes que pasar horas buscando, coordinando o reservando varios servicios por separado. Solo tienes que elegir, reservar y disfrutar."
      ]
    },
    {
      "q": "¿Es adecuado para una ocasión especial?",
      "a": [
        "Sí, nuestras experiencias son perfectas para celebrar un momento especial o simplemente para tomarte un tiempo para ti. Si tienes algo concreto en mente, también puedes [enviar una solicitud] para diseñar una experiencia totalmente a medida."
      ]
    },
    {
      "q": "¿Y si quiero algo más personalizado?",
      "a": [
        "Si buscas algo más específico, puedes enviar una solicitud a través de nuestro [formulario a medida]. Te ayudaremos a crear una experiencia más personalizada según la ocasión, tus preferencias y tu forma de viajar."
      ]
    },
    {
      "q": "¿Puedo cancelar o modificar mi reserva?",
      "a": [
        "Sí, las condiciones de cancelación y modificación se muestran claramente antes de confirmar tu reserva. Trabajamos de cerca con nuestros hoteles asociados para ofrecer condiciones flexibles y que puedas reservar con tranquilidad. También puedes gestionar tu reserva fácilmente desde tu cuenta de cliente."
      ]
    }
  ],
  "ru": [
    {
      "q": "Почему стоит бронировать через STAYMAKOM?",
      "a": [
        "STAYMAKOM больше, чем сервис бронирования отелей. Мы объединяем избранные отели и тщательно подобранные впечатления в одном простом бронировании, чтобы планировать поездку было легче, интереснее и спокойнее.",
        "Вместо того чтобы часами искать, где остановиться, чем заняться и как всё это организовать по отдельности, вы находите всё в одном месте. Наши пакеты устроены так, чтобы это было удобнее и выгоднее, чем бронировать каждую часть отдельно."
      ]
    },
    {
      "q": "Где доступны впечатления?",
      "a": [
        "Сейчас мы работаем в Израиле: впечатления в Тель-Авиве, Иерусалиме и многих других местах, которые ещё предстоит открыть. Израиль может предложить гораздо больше привычных маршрутов: множество мест, атмосфер и впечатлений по всей стране. Мы постоянно добавляем новые направления и приглашаем путешественников увидеть Израиль с другой стороны."
      ]
    },
    {
      "q": "Можно ли забронировать впечатление без ночёвки в отеле?",
      "a": [
        "Да. Теперь впечатления можно бронировать отдельно или вместе с проживанием в отеле. Ищете ли вы необычное занятие, полноценный отдых или и то и другое, STAYMAKOM позволяет выбрать то, что подходит именно вам.",
        "Некоторые впечатления дают особые преимущества или специальные цены при бронировании вместе с отелем, другие доступны и сами по себе."
      ]
    },
    {
      "q": "Для кого эти впечатления?",
      "a": [
        "STAYMAKOM создан и для путешественников, приезжающих в Израиль, и для местных жителей, которые хотят увидеть страну по-новому. Впервые ли вы открываете для себя Израиль или уже много лет проводите здесь каждое лето, STAYMAKOM поможет выйти за рамки привычных планов и найти впечатления, которые иначе вы могли бы пропустить."
      ]
    },
    {
      "q": "Придётся ли всё планировать самостоятельно?",
      "a": [
        "Нет, в этом и смысл. Каждое впечатление уже продумано за вас, поэтому не нужно часами искать, согласовывать и бронировать разные услуги по отдельности. Просто выбирайте, бронируйте и наслаждайтесь."
      ]
    },
    {
      "q": "Подходит ли это для особого случая?",
      "a": [
        "Да, наши впечатления отлично подходят, чтобы отметить особый момент или просто побыть наедине с собой. Если у вас есть конкретная идея, вы также можете [отправить запрос], и мы создадим впечатление полностью под вас."
      ]
    },
    {
      "q": "А если хочется чего-то более индивидуального?",
      "a": [
        "Если вы ищете что-то более конкретное, отправьте запрос через нашу [форму индивидуального запроса]. Мы поможем создать впечатление с учётом повода, ваших предпочтений и стиля путешествия."
      ]
    },
    {
      "q": "Можно ли отменить или изменить бронирование?",
      "a": [
        "Да, условия отмены и изменения чётко указаны до подтверждения бронирования. Мы тесно работаем с отелями-партнёрами, чтобы предлагать гибкие условия и чтобы вы могли бронировать спокойно. Управлять бронированием также легко прямо в личном кабинете."
      ]
    }
  ],
  "de": [
    {
      "q": "Warum über STAYMAKOM buchen?",
      "a": [
        "STAYMAKOM ist mehr als eine Plattform für Hotelbuchungen. Wir verbinden handverlesene Hotels mit sorgfältig ausgewählten Erlebnissen in einer einzigen, unkomplizierten Buchung. So planst du deinen Aufenthalt einfacher, inspirierter und ganz entspannt.",
        "Statt stundenlang zu suchen, wo du übernachtest, was du unternimmst und wie du alles einzeln organisierst, findest du bei STAYMAKOM alles an einem Ort. Unsere Pakete sind so gestaltet, dass sie reibungsloser und vorteilhafter sind, als jedes Element einzeln zu buchen."
      ]
    },
    {
      "q": "Wo finden die Erlebnisse statt?",
      "a": [
        "Im Moment konzentrieren wir uns auf Israel, mit Erlebnissen in Tel Aviv, Jerusalem und vielen weiteren Orten, die darauf warten, entdeckt zu werden. Israel hat viel mehr zu bieten als die üblichen Routen: eine große Vielfalt an Orten, Stimmungen und Erlebnissen im ganzen Land. Wir fügen laufend neue Ziele hinzu und laden Reisende ein, eine andere Seite Israels zu entdecken."
      ]
    },
    {
      "q": "Kann ich ein Erlebnis ohne Übernachtung buchen?",
      "a": [
        "Ja. Du kannst Erlebnisse jetzt einzeln oder als Teil eines Hotelaufenthalts buchen. Ob du eine besondere Aktivität, einen kompletten Kurzurlaub oder beides suchst: Bei STAYMAKOM wählst du die Option, die zu deinen Plänen passt.",
        "Manche Erlebnisse bieten exklusive Vorteile oder Sonderpreise, wenn du sie zusammen mit einem Hotel buchst, andere kannst du ganz unabhängig genießen."
      ]
    },
    {
      "q": "Für wen sind diese Erlebnisse gedacht?",
      "a": [
        "STAYMAKOM richtet sich an Reisende, die Israel besuchen, genauso wie an Einheimische, die das Land anders erleben möchten. Ob du Israel zum ersten Mal entdeckst oder seit Jahren jeden Sommer hier verbringst: STAYMAKOM hilft dir, über die üblichen Pläne hinauszugehen und Erlebnisse zu entdecken, die du sonst vielleicht nicht gefunden hättest."
      ]
    },
    {
      "q": "Muss ich alles selbst planen?",
      "a": [
        "Nein, genau darum geht es. Jedes Erlebnis ist bereits sorgfältig für dich durchdacht, sodass du nicht stundenlang recherchieren, koordinieren oder mehrere Leistungen einzeln buchen musst. Du wählst einfach aus, buchst und genießt."
      ]
    },
    {
      "q": "Passt das zu einem besonderen Anlass?",
      "a": [
        "Ja, unsere Erlebnisse eignen sich perfekt, um einen besonderen Moment zu feiern oder dir einfach Zeit für dich zu nehmen. Wenn du etwas Bestimmtes im Kopf hast, kannst du auch [eine Anfrage senden], und wir gestalten ein ganz individuelles Erlebnis."
      ]
    },
    {
      "q": "Und wenn ich etwas noch Persönlicheres möchte?",
      "a": [
        "Wenn du etwas Spezielleres suchst, kannst du über unser [Formular für individuelle Anfragen] eine Anfrage senden. Wir helfen dir, ein persönlicheres Erlebnis zu gestalten, abgestimmt auf deinen Anlass, deine Vorlieben und deinen Reisestil."
      ]
    },
    {
      "q": "Kann ich meine Buchung stornieren oder ändern?",
      "a": [
        "Ja, die Storno- und Änderungsbedingungen werden klar angezeigt, bevor du deine Buchung bestätigst. Wir arbeiten eng mit unseren Partnerhotels zusammen, um flexible Bedingungen anzubieten, damit du mit gutem Gefühl buchen kannst. Deine Buchung kannst du außerdem ganz einfach in deinem Kundenkonto verwalten."
      ]
    }
  ]
};
