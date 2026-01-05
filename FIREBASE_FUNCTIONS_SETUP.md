# 🚀 Firebase Cloud Functions Setup

## Что создано

Я создал Firebase Cloud Functions для замены локального сервера:

```
functions/
  ├── index.js      # Cloud Functions для Stripe
  └── package.json  # Зависимости
firebase.json       # Конфигурация Firebase
.firebaserc         # Привязка к проекту
```

## 📋 Шаги для деплоя

### Шаг 1: Установи Firebase CLI (если еще не установлен)

```bash
npm install -g firebase-tools
```

### Шаг 2: Войди в Firebase

```bash
firebase login
```

### Шаг 3: Установи зависимости для Functions

```bash
cd functions
npm install
cd ..
```

### Шаг 4: Настрой секреты Stripe

```bash
# Установи секретный ключ Stripe
firebase functions:config:set stripe.secret_key="sk_live_твой_секретный_ключ"

# Установи Price ID (опционально, уже захардкожены)
firebase functions:config:set stripe.price_monthly="price_1SkOx6GLI9gGYuFfKpivFSc1"
firebase functions:config:set stripe.price_yearly="price_1SkOxfGLI9gGYuFfUkxLgHsK"

# Установи Webhook Secret (для продакшена)
firebase functions:config:set stripe.webhook_secret="whsec_твой_webhook_secret"
```

### Шаг 5: Задеплой Functions

```bash
firebase deploy --only functions
```

После деплоя ты увидишь URLs функций:
```
✔  functions[createCheckoutSession]: https://us-central1-calm-down-space.cloudfunctions.net/createCheckoutSession
✔  functions[createPortalSession]: https://us-central1-calm-down-space.cloudfunctions.net/createPortalSession
✔  functions[sessionStatus]: https://us-central1-calm-down-space.cloudfunctions.net/sessionStatus
✔  functions[linkSubscription]: https://us-central1-calm-down-space.cloudfunctions.net/linkSubscription
✔  functions[stripeWebhook]: https://us-central1-calm-down-space.cloudfunctions.net/stripeWebhook
✔  functions[health]: https://us-central1-calm-down-space.cloudfunctions.net/health
```

### Шаг 6: Настрой Stripe Webhook

1. Открой Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Нажми "Add endpoint"
3. URL: `https://us-central1-calm-down-space.cloudfunctions.net/stripeWebhook`
4. Выбери события:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Скопируй Webhook Signing Secret
6. Добавь его в Firebase config:
   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   firebase deploy --only functions
   ```

---

## 🧪 Тестирование локально

Можешь тестировать Functions локально с эмулятором:

```bash
# Установи конфиг для эмулятора
firebase functions:config:get > functions/.runtimeconfig.json

# Запусти эмулятор
firebase emulators:start --only functions
```

Эмулятор будет доступен на: `http://localhost:5001/calm-down-space/us-central1/`

---

## 🔧 Обновление фронтенда

Фронтенд уже обновлен! Он автоматически:
- Использует `localhost:4242` для разработки
- Использует Firebase Functions для продакшена

---

## 📦 Деплой всего приложения

После деплоя Functions, можешь задеплоить весь сайт:

```bash
# Собери фронтенд
npm run build

# Задеплой на Firebase Hosting
firebase deploy
```

---

## ✅ Проверка

После деплоя проверь:

1. **Health endpoint:**
   ```
   https://us-central1-calm-down-space.cloudfunctions.net/health
   ```
   Должно вернуть: `{"status":"ok","prices":{...}}`

2. **Попробуй оплатить** на продакшен сайте

---

## 🆘 Если что-то не работает

### Проверь логи Functions:
```bash
firebase functions:log
```

### Проверь конфигурацию:
```bash
firebase functions:config:get
```

### Передеплой:
```bash
firebase deploy --only functions
```

---

## 💰 Стоимость

Firebase Functions на Blaze плане:
- **2 миллиона вызовов в месяц** — бесплатно
- После этого: $0.40 за миллион вызовов
- Для небольшого приложения = **практически бесплатно**


