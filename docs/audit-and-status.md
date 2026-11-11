# Lumière — технический отчет и аудит готовности

**Дата аудита:** 11 ноября 2026 года

**Проект:** `front-web`

**Стек:** Next.js 16.4.3 App Router, React 19, TypeScript strict, Tailwind CSS 4, pnpm
**Область:** текущая рабочая копия фронтенда и контракт публичного .NET API.

## 1. Полный перечень реализованного функционала

### 1.1. Публичная витрина и каталог

- Подключен серверный API-слой для товаров и категорий через `API_URL`.
- Витрина получает активные товары из backend API с поиском и серверной фильтрацией.
- Добавлены страницы категорий `/catalog/[slug]`.
- Категории загружаются в Header, мобильное меню и фильтры каталога.
- Плоский список категорий преобразуется в дерево через `buildCategoryTree()` с сортировкой по `sortOrder` и названию.
- Карточка товара открывается по `/product/[slug]` и загружается на сервере.
- На странице товара реализованы:
  - галерея с главным изображением и дополнительными изображениями;
  - мобильный горизонтальный свайпер;
  - ссылка на категорию;
  - SKU, цена, старая цена и расчет скидки;
  - статус наличия и ограничение количества остатком;
  - добавление в корзину;
  - описание и таблица характеристик из JSON-строки `attributes`.
- При отсутствии `mainImageUrl` используется `/product-placeholder.svg`.

### 1.2. Корзина

- `CartProvider` хранит позиции в `localStorage` под ключом `lumiere:cart`.
- Гидратация выполняется после первого клиентского рендера, поэтому серверный HTML не расходится с клиентом.
- Добавление товара ограничивается текущим складским остатком.
- В `/cart` доступны:
  - миниатюра и ссылка на товар;
  - цена позиции и сумма;
  - изменение количества;
  - удаление позиции;
  - пересчет итоговой суммы;
  - переход к `/checkout`;
  - empty state с переходом в каталог.
- Drawer корзины использует то же состояние, что и страница корзины; независимых копий состояния нет.

### 1.3. Checkout и заказ

- `/checkout` — гостевой checkout без принудительной регистрации.
- Валидация формы выполнена через `react-hook-form` и Zod:
  - имя и фамилия;
  - украинский телефон формата `+380XXXXXXXXX`;
  - необязательный email;
  - город и точка Новой Пошты;
  - тип доставки `warehouse` или `postomat`;
  - оплата `cod` или `iban`;
  - необязательный комментарий.
- Стоимость доставки не включается скрыто в сумму товаров и показывается как тариф Новой Пошты.
- `src/lib/api/orders.ts` изолирует order adapter и формирует DTO:
  - `items` с `productId` и `quantity`;
  - `customer`;
  - `delivery` с `service: "nova_poshta"`;
  - `paymentMethod`;
  - `comment`.
- Пока backend endpoint заказов не подключен: адаптер валидирует данные, имитирует задержку сети, генерирует локальный ID `LUM-*`, записывает заказ в `sessionStorage` и очищает корзину.
- `/order/success` выводит ID и сумму заказа.
- Для `cod` показывается информация об отправке Новой Поштой с оплатой при получении.
- Для `iban` выводятся получатель, IBAN и назначение платежа; реквизиты можно скопировать.

### 1.4. Служебные и юридические страницы

В Footer добавлены ссылки на:

- `/delivery-and-payment` — комплектация 1–2 рабочих дня, Нова Пошта, тарифы перевозчика, COD и IBAN, UAH и отсутствие скрытых комиссий;
- `/returns` — возврат/обмен товара надлежащего качества в течение 14 дней, условия, процесс и распределение стоимости обратной доставки;
- `/contacts` — телефон, email, Telegram/мессенджер и график работы из env;
- `/privacy-policy` — назначение и обработка данных checkout;
- `/terms` — базовая структура публичной оферты.

Контактные данные, IBAN и адрес возврата вынесены в публичные env-переменные. При их отсутствии интерфейс показывает предупреждающие fallback-тексты, а не выдуманные реквизиты.

### 1.5. GTM и GA4 Ecommerce

- `GoogleTagManager` подключается только при валидном `NEXT_PUBLIC_GTM_ID`.
- В `dataLayer` реализованы события:
  - `add_to_cart` при добавлении товара;
  - `remove_from_cart` при удалении;
  - `view_cart` на `/cart`;
  - `begin_checkout` на `/checkout`;
  - `purchase` на `/order/success`.
- События передают `item_id`, `item_name`, `price`, `quantity`, категорию, `value` и валюту `UAH`.
- Перед каждым ecommerce-событием выполняется сброс предыдущего ecommerce payload.

### 1.6. Админ-модули

#### Поставщики — `/admin/suppliers`

- Таблица всех поставщиков с колонками названия, контакта, города, статуса, заметок и действий.
- Быстрый поиск по названию/городу.
- Фильтр «все / только активные».
- Создание и редактирование через форму с Zod + `react-hook-form`.
- Удаление/деактивация через backend.
- ProblemDetails backend преобразуется в пользовательское сообщение.
- `useSuppliersLookup()` отдает `{ id, name }[]` для формы товара.

#### Товары — `/admin/products`

- Таблица с миниатюрой, названием, SKU, категорией, поставщиком, ценой, старой ценой, drop-ценой, маржой, остатком, активностью и действиями.
- Поиск по названию/SKU.
- Фильтрация по категории и поставщику.
- Создание и редактирование товара.
- Поля цены, старой цены, drop-цены, остатка, веса, описания, SEO и активности.
- Автогенерация slug из названия.
- Ввод `mainImageUrl` и дополнительных изображений с `alt` и `sortOrder`.
- Выбор категории через API категорий и поставщика через `useSuppliersLookup()`.

### 1.7. SEO, sitemap и Merchant feed

- `/robots.txt` генерируется через `src/app/robots.ts`.
- `/sitemap.xml` генерируется через `src/app/sitemap.ts`.
- Sitemap включает активные категории, активные товары и публичные служебные страницы.
- URL в sitemap дополнительно экранируются для XML, включая query-параметры изображений.
- `/feed.xml` реализован как Route Handler с RSS 2.0 и namespace Google Merchant Center.
- Feed получает активные товары через существующий API-слой, формирует абсолютные ссылки и экранирует XML.
- При тестовом запросе к собранному handler backend вернул HTTP 200 и 18 товарных позиций.

### 1.8. Таблица ключевых созданных и измененных файлов

| Файл | Назначение |
|---|---|
| `src/app/layout.tsx` | Корневой layout, категории в Header, CartProvider, GTM. |
| `src/app/globals.css` | Tailwind-токены и системные offline-шрифты. |
| `src/app/page.tsx` | Главная страница, SSR-загрузка товаров и категорий. |
| `src/app/catalog/[slug]/page.tsx` | SSR-страница категории. |
| `src/app/product/[slug]/page.tsx` | SSR-деталка товара, metadata, canonical и Product JSON-LD. |
| `src/components/catalog/CatalogSection.tsx` | Секция каталога, категории и фильтрация. |
| `src/components/catalog/ProductCard.tsx` | Карточка товара и добавление в корзину. |
| `src/components/catalog/ProductGrid.tsx` | Сетка товаров и empty/skeleton-состояния. |
| `src/components/product/ProductDetails.tsx` | Галерея, цена, наличие, характеристики и покупка. |
| `src/features/product/product-utils.ts` | Галерея, SEO description, скидки и парсинг attributes. |
| `src/types/product.ts` | Frontend-модель товара. |
| `src/types/category.ts` | `Category` и `CategoryTreeNode`. |
| `src/lib/api/client.ts` | Серверный API-клиент и ProblemDetails/API errors. |
| `src/lib/api/products.ts` | Получение активных товаров, пагинация и DTO mapping. |
| `src/lib/api/categories.ts` | Получение категорий и построение дерева. |
| `src/components/cart/CartContext.tsx` | Постоянное состояние корзины и безопасная гидратация. |
| `src/components/cart/CartPage.tsx` | Страница корзины. |
| `src/components/cart/CartDrawer.tsx` | Выдвижная корзина в Header. |
| `src/lib/cart/constants.ts` | Ключ `localStorage` корзины. |
| `src/app/cart/page.tsx` | Маршрут корзины с `noindex`. |
| `src/app/checkout/page.tsx` | Маршрут гостевого checkout с `noindex`. |
| `src/components/checkout/CheckoutForm.tsx` | Форма контактов, доставки и оплаты. |
| `src/lib/api/orders.ts` | Zod-схемы и временный order adapter. |
| `src/app/order/success/page.tsx` | Страница успешного заказа с `noindex`. |
| `src/components/order/OrderSuccess.tsx` | COD/IBAN-информация, копирование реквизитов и purchase event. |
| `src/lib/analytics/data-layer.ts` | GTM/GA4 ecommerce dataLayer API. |
| `src/components/analytics/GoogleTagManager.tsx` | Условное подключение GTM. |
| `src/lib/config/shop.ts` | Контакты, IBAN, адрес возврата и Footer links из env. |
| `src/components/layout/Footer.tsx` | Footer с обязательными служебными страницами и контактами. |
| `src/components/content/InfoPage.tsx` | Общий shell служебных страниц. |
| `src/app/delivery-and-payment/page.tsx` | Доставка и оплата. |
| `src/app/returns/page.tsx` | Возврат и обмен. |
| `src/app/contacts/page.tsx` | Контакты и график. |
| `src/app/privacy-policy/page.tsx` | Политика конфиденциальности. |
| `src/app/terms/page.tsx` | Публичная оферта. |
| `src/app/admin/suppliers/page.tsx` | SSR shell админки поставщиков. |
| `src/components/admin/suppliers/SuppliersAdmin.tsx` | Таблица и действия поставщиков. |
| `src/components/admin/suppliers/SupplierForm.tsx` | Форма поставщика. |
| `src/lib/api/admin/suppliers.ts` | CRUD API поставщиков. |
| `src/app/api/admin/suppliers/route.ts` | Proxy Route Handler списка/создания поставщиков. |
| `src/app/api/admin/suppliers/[id]/route.ts` | Proxy Route Handler деталки/изменения/удаления. |
| `src/features/admin/suppliers/supplier-schema.ts` | Zod-схема поставщика. |
| `src/types/supplier.ts` | Supplier DTO и lookup type. |
| `src/hooks/useSuppliersLookup.ts` | Lookup активных поставщиков для товара. |
| `src/app/admin/products/page.tsx` | SSR shell админки товаров. |
| `src/components/admin/products/ProductsAdmin.tsx` | Таблица, фильтры и действия товаров. |
| `src/components/admin/products/ProductForm.tsx` | Форма товара, изображений и SEO. |
| `src/lib/api/admin/products.ts` | CRUD API товаров. |
| `src/app/api/admin/products/route.ts` | Proxy Route Handler списка/создания товаров. |
| `src/app/api/admin/products/[id]/route.ts` | Proxy Route Handler деталки/изменения/удаления. |
| `src/features/admin/products/product-schema.ts` | Zod-схема товара. |
| `src/app/robots.ts` | Правила индексации и ссылка на sitemap. |
| `src/app/sitemap.ts` | Динамический XML sitemap. |
| `src/app/feed.xml/route.ts` | RSS 2.0 Google Shopping feed. |
| `public/product-placeholder.svg` | Локальная заглушка изображения товара. |
| `next.config.ts` | `remotePatterns` для Supabase Storage и legacy image sources. |
| `.env.example` | Шаблон production-переменных. |

## 2. Аудит готовности к Google Shopping / Merchant Center

### 2.1. Служебные страницы и прозрачность магазина

| Критерий | Текущее состояние | Риск |
|---|---|---|
| Сроки комплектации | Указано `1–2 робочих дні` после подтверждения данных. | Низкий технический риск. Нужно проверить соответствие фактической операционной практике. |
| Доставка | Указана Нова Пошта, отделение/поштомат и тарифы перевозчика. | Средний риск: нужно подтвердить финальную формулировку и реальные тарифные условия. |
| Оплата | Описаны COD и IBAN, цены указаны в UAH, скрытые комиссии не заявлены. | Высокий production-риск, если IBAN фактически не заполнен. |
| Возврат | Указаны 14 дней, условия сохранности товара, процесс обращения и кто оплачивает обратную доставку. | Средний/высокий риск: адрес возврата может отображаться как «буде вказана менеджером», срок возврата денег сформулирован общо. |
| Контакты | Страница и график есть, но телефон/email/Telegram берутся из env. | Высокий риск до заполнения реальных данных. Сейчас возможны тексты «Додайте номер у налаштуваннях». |
| Политика и оферта | Страницы существуют и описывают базовый процесс. | Высокий риск: прямо указано, что юридические реквизиты продавца нужно добавить перед публикацией. |

**Вывод по служебным страницам:** техническая структура готова, но политика Misrepresentation не закрыта до конца. Google должен видеть реального продавца, рабочие контакты, адрес/реквизиты, понятные сроки и исполнимую процедуру возврата. Fallback-тексты и незаполненные реквизиты в production недопустимы.

### 2.2. Структура `/feed.xml`

Route Handler `src/app/feed.xml/route.ts` формирует RSS 2.0:

```xml
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <item>
      <g:id>...</g:id>
      <g:title>...</g:title>
      <g:description>...</g:description>
      <g:link>https://site.example/product/slug</g:link>
      <g:image_link>https://storage.example/image.webp</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>990.00 UAH</g:price>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
    </item>
  </channel>
</rss>
```

Проверено:

- товары запрашиваются через `getProducts()`, который отправляет backend параметр `OnlyActive=true`;
- `g:id` — SKU, а при его отсутствии ID товара;
- `g:title` и `g:description` XML-экранируются;
- HTML-теги из описания удаляются перед записью в feed;
- `g:link` строится из slug и `NEXT_PUBLIC_SITE_URL`;
- `g:image_link` строится из `mainImageUrl`, а относительная placeholder-ссылка преобразуется в абсолютную;
- `g:availability` зависит от `stock > 0`;
- цена форматируется с двумя знаками и валютой `UAH`;
- `g:identifier_exists` установлен в `no`;
- ответ имеет `Content-Type: application/xml; charset=utf-8`;
- тестовый production handler вернул HTTP 200 и 18 `<item>`.

### 2.3. Риски блокировки или отклонения

1. **Локальный домен в production.** Если `NEXT_PUBLIC_SITE_URL` не задан, feed, robots и sitemap используют `http://localhost:3000`. Такие ссылки неприемлемы для Merchant Center.
2. **Тестовые домены изображений.** В `src/lib/mock/products.ts` остались ссылки `images.unsplash.com`, а в `next.config.ts` разрешены `images.unsplash.com`, `picsum.photos` и `placehold.co`. Публичный каталог сейчас должен работать от backend, но эти источники нужно удалить или гарантированно исключить из production-данных.
3. **Placeholder как товарная картинка.** Если backend не отдает `mainImageUrl`, feed публикует `/product-placeholder.svg`. Для Google это технически абсолютная ссылка после преобразования, но это не реальное изображение товара и может ухудшить качество/привести к отклонению позиции.
4. **Текст-рыба.** В исходниках нет найденных вхождений `lorem`/`Lorem ipsum`, однако live-описания приходят из backend и отдельной выгрузкой не проверялись. Нужно проверить все активные товары в API.
5. **Нет реального домена и юридических данных в репозитории.** `.env.example` содержит `your-domain.example`, localhost и шаблонные реквизиты. Это ожидаемая безопасная заготовка, но не production-конфигурация.
6. **Неполный товарный набор для отдельных категорий.** Feed содержит минимально запрошенные поля, но для части категорий могут понадобиться `g:brand`, `g:gtin` или `g:mpn`, а также shipping/tax-настройки Merchant Center.
7. **Заказ не отправляется в backend.** Это не ломает сам feed, но делает checkout демонстрационным и снижает общую коммерческую готовность сайта.

### 2.4. Оценка готовности

**Оценка прохождения модерации сейчас: 40%.**

- техническая реализация feed, URL и XML: примерно 80%;
- наличие служебных страниц: примерно 70%, но с незаполненными реквизитами;
- достоверность продавца и контактов: примерно 20% до заполнения env;
- готовность бизнес-процесса заказа/оплаты/возврата: примерно 25%, поскольку заказ пока локальный и IBAN не подключен к реальному процессу.

Основная причина низкой итоговой оценки — не код feed, а риск несоответствия публичного магазина реальному продавцу. После заполнения домена, контактов, реквизитов, реальных изображений/описаний и подключения заказов оценка может подняться до 80–90%. Остаток будет зависеть от Merchant Center diagnostics и товарных требований конкретных категорий.

## 3. Комплексная оценка SEO

### 3.1. Техническое SEO

#### Robots

`src/app/robots.ts`:

- разрешает `/`;
- закрывает `/admin`;
- закрывает `/api`;
- закрывает `/checkout`;
- закрывает `/order/success`;
- публикует ссылку на `/sitemap.xml`.

Это соответствует назначению маршрутов. При этом URL sitemap также зависит от `NEXT_PUBLIC_SITE_URL` и при отсутствии переменной становится локальным.

#### Sitemap

`src/app/sitemap.ts`:

- получает только активные товары;
- получает только активные категории;
- создает `/catalog/[slug]` и `/product/[slug]`;
- добавляет публичные служебные страницы;
- добавляет `lastModified` товаров из `updatedAt`;
- поддерживает image sitemap через `images`;
- экранирует амперсанды в URL, потому что текущий Next.js resolver вставляет значения в XML без достаточного escaping.

Недостаток: при ошибке backend sitemap молча возвращает только статические страницы — это предотвращает падение маршрута, но может скрыть проблему неполной индексации. Нужны логирование/мониторинг и проверка размера sitemap.

### 3.2. On-Page SEO и metadata

Для `/product/[slug]` реализовано:

- серверная загрузка товара по slug;
- `notFound()` при 404;
- `metaTitle` с fallback `${name} — купити в інтернет-магазині`;
- `metaDescription` из backend с fallback на описание и ограничением примерно 160 символов;
- canonical URL;
- Open Graph `title`, `description`, `url`, `images`, `type: website`;
- Twitter Card `summary_large_image`;
- Product JSON-LD с `name`, `image`, `description`, `sku`, `offers.price`, `priceCurrency: UAH` и абсолютным `availability`:
  - `https://schema.org/InStock`;
  - `https://schema.org/OutOfStock`.
- визуальные хлебные крошки на странице товара.

Корзина, checkout и success page имеют `noindex, nofollow`, что предотвращает индексацию пользовательских и транзакционных маршрутов.

### 3.3. Что нужно добавить для максимального SEO-результата

1. Добавить JSON-LD `BreadcrumbList` для товара и категории. Визуальная навигация уже есть, но поисковику не передается структурированная цепочка.
2. Добавить JSON-LD `Organization`/`LocalBusiness` с реальными названием, URL, контактами и профилями магазина.
3. Добавить `brand`, `gtin`/`mpn` в Product JSON-LD и Merchant feed, если эти данные доступны. Если штрихкода нет, это должно быть согласованно с feed-логикой.
4. Добавить полноценные metadata для `/catalog/[slug]`: title, description, canonical и Open Graph на основе категории.
5. Добавить `og:site_name`, favicon/иконки бренда и, после появления реального домена, корректный `metadataBase` на уровне layout.
6. Проверить alt-тексты всех реальных изображений. Основные изображения получают `alt` из названия товара; thumbnail-дубликаты имеют пустой alt намеренно. Для данных из backend нужно исключить пустые или технические alt у основного изображения.
7. Убрать или заменить Unsplash/Picsum-фон Hero на оптимизированный локальный/production-asset. Текущий Hero использует CSS background image, поэтому LCP и загрузка изображения не контролируются так хорошо, как через `next/image`.
8. Провести Lighthouse и Core Web Vitals аудит: LCP, CLS, INP, размер изображений, cache headers и mobile performance пока измерены не были.
9. Проверить страницы с реальными данными в Google Rich Results Test, Schema Markup Validator и Merchant Center diagnostics.

## 4. Пошаговый чек-лист для разработчика

### 4.1. Что дописать или поправить во фронтенде

- [ ] Подключить реальный backend endpoint создания заказа вместо симуляции в `src/lib/api/orders.ts`.
- [ ] Перенести итоговую цену, наличие и состав заказа под серверный расчет backend; клиентская сумма не должна быть источником истины.
- [ ] Сделать idempotency для повторной отправки checkout и обработку статусов заказа.
- [ ] Подключить подтверждение IBAN-оплаты и реальный статус резерва/отправки.
- [ ] Добавить API-интеграцию Новой Пошты или согласованный справочник городов/отделений/поштоматов.
- [ ] Закрыть `/admin` и `/api/admin/*` реальной авторизацией и middleware/проверкой HTTP-only session cookie.
- [ ] Не полагаться на `sessionStorage` для страницы успеха после реального заказа: success page должна получать заказ по server-side ID и показывать только подтвержденные данные.
- [ ] Заполнить metadata для страниц категорий и добавить `BreadcrumbList`/`Organization` JSON-LD.
- [ ] Добавить в feed дополнительные изображения через `g:additional_image_link`, если они есть.
- [ ] Решить стратегию для товаров без изображения: не публиковать их в feed до появления реальной картинки либо загрузить корректные product assets.
- [ ] Удалить из production-кода/данных `src/lib/mock/products.ts`, Unsplash/Picsum и `placehold.co`, если они больше не нужны.
- [ ] Добавить интеграционные тесты для XML feed: 200, content type, абсолютные URL, отсутствие localhost, XML parsing, обязательные `g:*` поля.
- [ ] Проверить поведение `sitemap.xml` при недоступном backend и добавить логирование ошибки/алерт.
- [ ] Актуализировать README: в нем еще осталась старая заметка про `next/font/google`, хотя layout уже переведен на системный стек.
- [ ] Провести ручную проверку mobile Header, меню, корзины, checkout и светлой/темной темы.

### 4.2. Production env

Обязательные или рекомендуемые переменные:

```dotenv
# Серверный URL боевого .NET API
API_URL=https://<production-backend>/api

# Реальный HTTPS-домен фронтенда без localhost
NEXT_PUBLIC_SITE_URL=https://<shop-domain>

# GTM container, если аналитика подключается
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Реальные публичные контакты продавца
NEXT_PUBLIC_SHOP_PHONE=+380XXXXXXXXX
NEXT_PUBLIC_SHOP_EMAIL=hello@example.com
NEXT_PUBLIC_SHOP_TELEGRAM=https://t.me/<account>
NEXT_PUBLIC_SHOP_HOURS=Пн–Пт: 09:00–19:00; Сб–Нд: 10:00–18:00

# Реальные платежные реквизиты
NEXT_PUBLIC_IBAN_RECIPIENT=ФОП/ТОВ <полное юридическое название>
NEXT_PUBLIC_IBAN=UA_______________________________

# Реальный адрес возврата
NEXT_PUBLIC_RETURNS_ADDRESS=<город, адрес или согласованное отделение Новой Пошты>
```

`NEXT_PUBLIC_API_URL` для текущей архитектуры не нужен: запросы выполняются сервером через `API_URL` и Route Handlers. Секреты, токены и приватные ключи нельзя добавлять в `NEXT_PUBLIC_*`.

### 4.3. Задачи по backend и интеграциям

- [ ] Согласовать и реализовать `POST /api/orders` с DTO checkout, серверной валидацией и ProblemDetails.
- [ ] На backend повторно проверить цену, stock, активность товара и доступность supplier/category.
- [ ] Реализовать резервирование остатка, срок резерва и освобождение резерва при неоплате.
- [ ] Добавить статусы заказа: создан, ожидает IBAN-оплату, подтвержден, собирается, отправлен, завершен, отменен.
- [ ] Подключить уведомление/подтверждение оплаты IBAN и безопасную обработку webhook от платежного провайдера, если он появится.
- [ ] Зафиксировать правила COD, комиссий перевозчика и кто их оплачивает.
- [ ] Согласовать API Новой Пошты: город, отделение/поштомат, валидные идентификаторы и формат ТТН.
- [ ] Заполнить реальные товары: названия, описания без текста-рыбы, SKU, цены UAH, остатки, категории, изображения и alt.
- [ ] Согласовать поля `brand`, `gtin`, `mpn`, `identifier_exists` для Google Merchant Center.
- [ ] Добавить авторизацию админки, роли, CSRF/CORS-политику и аудит destructive CRUD-операций.
- [ ] Проверить, что backend хранит и возвращает публичные HTTPS URL изображений Supabase Storage.

### 4.4. Перед отправкой feed в Merchant Center

1. Задать `NEXT_PUBLIC_SITE_URL` реальным HTTPS-доменом на всех production environments.
2. Открыть в браузере и через `curl`:
   - `/robots.txt`;
   - `/sitemap.xml`;
   - `/feed.xml`.
3. Убедиться, что в XML нет `localhost`, `your-domain.example`, `picsum.photos`, `unsplash.com`, placeholder-картинок и неэкранированных `&`.
4. Провалидировать `/feed.xml` XML-парсером и проверить каждый item на обязательные поля и корректную валюту `UAH`.
5. Проверить, что каждая `g:link` открывает активную страницу товара с HTTP 200, корректным canonical и теми же ценой/остатком, что в feed.
6. Проверить, что каждая `g:image_link` открывается без авторизации, возвращает изображение, имеет HTTPS и показывает именно соответствующий товар.
7. Сверить цены в backend, карточке, JSON-LD, feed, корзине и checkout; исключить расхождения округления и старой цены.
8. Проверить активные товары: `stock > 0` должны иметь `in_stock`, а скрытые/неактивные товары не должны попасть в feed.
9. Заполнить и проверить реальные страницы доставки, возврата, контактов, privacy и terms; удалить все fallback-тексты.
10. Добавить юридические данные продавца, адрес, email, телефон, часы работы и реальные платежные реквизиты.
11. Настроить в Merchant Center информацию о бизнесе, доставке, возвратах и домене; подтвердить и заявить домен.
12. В Google Search Console добавить sitemap и проверить индексацию ключевых товарных URL.
13. В Merchant Center создать источник данных по URL `https://<shop-domain>/feed.xml`.
14. После загрузки проверить Diagnostics: policy issues, missing identifiers, image quality, price mismatch, availability mismatch и landing page errors.
15. Только после устранения предупреждений запускать рекламу и регулярно мониторить feed/checkout/заказы.

## Итоговый вывод

Фронтендовый каркас магазина, каталог, карточка товара, корзина, checkout UI, админские CRUD-модули, SEO-маршруты, GTM/GA4 events, sitemap и Google Shopping feed реализованы и проходят статические проверки. Основные блокеры production и Merchant Center находятся в данных и интеграциях: реальный домен, юридические реквизиты, контакты, IBAN, настоящие product assets, серверное создание заказов, авторизация админки и финальная проверка Google diagnostics.
