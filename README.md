# Academy Hightech 📚

A full-stack digital book platform for academic and technical content. Users can browse, stream, and track reading progress across curated book series, with support for tiered subscriptions and secure, watermarked PDF delivery.

---

## Architecture Overview

```
academy_hightech/
├── api/              # Laravel 11 REST API (backend)
├── js/               # Vanilla JS frontend logic
├── css/              # Frontend stylesheets
├── assets/           # Images and static assets
├── books/            # Book-related frontend pages
├── series/           # Series-related frontend pages
├── index.html        # Landing page
├── auth.html         # Login / Register page
├── library.html      # Book library / discovery
├── profile.html      # User profile & account settings
├── subscription.html # Subscription plans & checkout
├── admin.html        # Admin dashboard
├── author.html       # Author profile page
└── manifesto.html    # Platform manifesto page
```

The frontend is plain HTML + CSS + Vanilla JavaScript, served statically (e.g. via Live Server or any HTTP server). It communicates with the Laravel backend over a REST API.

---

## Features

- **Book Discovery** — Browse newest, most popular, and recently updated books
- **Full-Text Search** — Search by title or author
- **Secure PDF Streaming** — Watermarked PDFs streamed on-the-fly per user; cached for subsequent requests via background jobs
- **Reading Progress** — Real-time progress (page & percentage) stored in Redis, synced to SQLite by a scheduled job; degrades gracefully when Redis is unavailable
- **Reading Shelf** — Track books by status: `want_to_read`, `reading`, or `finished`
- **Favorites** — Toggle books as favorites
- **Book Suggestions** — Personalized recommendations based on reading history
- **Subscriptions** — Free / Standard / Premium tiers with Stripe and Iyzico payment gateways
- **Notifications** — In-app release and update notifications
- **Admin Panel** — Manage users, subscriptions, and view platform statistics
- **Password Reset** — Email-based password reset flow
- **Data Export** — Users can export their own account data

---

## Tech Stack

### Backend (`/api`)
| Layer | Technology |
|---|---|
| Framework | Laravel 11 |
| Authentication | Laravel Sanctum (token-based) |
| Database | SQLite (default) |
| Cache / Progress | Redis |
| Queue | Laravel Queue (database driver) |
| PDF Watermarking | Custom `PdfWatermarkService` |
| Payment | Stripe & Iyzico via `PaymentService` |
| Mail | SMTP / log driver (configurable) |

### Frontend
| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | Vanilla CSS |
| Logic | Vanilla JavaScript (ES Modules) |
| API Communication | `fetch` via `js/config.js` base URL |

---

## Getting Started

### Prerequisites

- PHP >= 8.2
- Composer
- Redis (optional but recommended — the app degrades gracefully without it)
- A local server for the frontend (e.g. VS Code Live Server, Laragon)

### Backend Setup

```bash
# 1. Navigate to the API directory
cd api

# 2. Install PHP dependencies
composer install

# 3. Copy and configure environment
cp .env.example .env

# 4. Generate application key
php artisan key:generate

# 5. Run migrations
php artisan migrate

# 6. Seed the database (creates demo users, books, subscriptions)
php artisan db:seed

# 7. Start the development server
php artisan serve
```

The API will be available at `http://localhost:8000/api`.

### Frontend Setup

1. Open `js/config.js` and set `API_BASE_URL` to your running API server:
   ```js
   window.APP_CONFIG = {
     API_BASE_URL: 'http://localhost:8000/api'
   };
   ```
2. Serve the root directory with any static file server (e.g. VS Code Live Server on port `5500`).
3. Open `http://127.0.0.1:5500/index.html` in your browser.

> **Laragon users:** If you use Laragon, the default base URL is already configured as `http://localhost/api/public/api`.

---

## Environment Variables

Key variables in `.env` (see `.env.example` for the full list):

| Variable | Description |
|---|---|
| `DB_CONNECTION` | Database driver (default: `sqlite`) |
| `REDIS_HOST` | Redis host (default: `127.0.0.1`) |
| `REDIS_PORT` | Redis port (default: `6379`) |
| `QUEUE_CONNECTION` | Queue driver (default: `database`) |
| `PAYMENT_WEBHOOK_SECRET` | Shared secret for verifying payment webhooks |
| `FRONTEND_URL` | Frontend base URL used in password-reset emails |
| `MAIL_MAILER` | Mail driver (`log` for development, `smtp` for production) |

---

## Seeded Demo Accounts

After running `php artisan db:seed`:

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `adminpassword` | Admin (Premium) |
| `test@example.com` | `password` | User (Premium) |

---

## API Reference

All protected routes require a `Bearer` token in the `Authorization` header (obtained from `/api/auth/login`).

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new account |
| `POST` | `/api/auth/login` | Login and receive a Sanctum token |
| `POST` | `/api/auth/forgot-password` | Request a password reset email |
| `POST` | `/api/auth/reset-password` | Reset password with token |

### User Profile
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/profile` | Get authenticated user's profile |
| `PUT` | `/api/user/profile` | Update profile |
| `GET` | `/api/user/payments` | Payment history |
| `GET` | `/api/user/sessions` | Active sessions |
| `DELETE` | `/api/user/sessions` | Logout from all devices |
| `POST` | `/api/user/deactivate` | Deactivate account |
| `DELETE` | `/api/user/account` | Permanently delete account |
| `GET` | `/api/user/export` | Export user data |

### Books
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/books/new` | Newest books (paginated) |
| `GET` | `/api/books/popular` | Most popular books |
| `GET` | `/api/books/my-reads` | User's reading list (Redis-overlaid) |
| `GET` | `/api/books/search?q=` | Search by title or author |
| `GET` | `/api/books/recently-updated` | Recently updated (cached, sidebar) |
| `GET` | `/api/books/favorites` | User's favorite books |
| `POST` | `/api/books/{id}/favorite` | Toggle favorite status |
| `GET` | `/api/books/suggested` | Personalized book suggestions |
| `GET` | `/api/books/{id}/stream` | Stream watermarked PDF |
| `POST` | `/api/books/{id}/progress` | Update reading progress |
| `GET` | `/api/books/my-shelf` | Books grouped by reading status |
| `POST` | `/api/books/{id}/track` | Add book to shelf |
| `PATCH` | `/api/books/{id}/track` | Update shelf status |
| `DELETE` | `/api/books/{id}/track` | Remove book from shelf |

### Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/subscriptions` | List available plans |
| `POST` | `/api/subscriptions/subscribe` | Start a checkout session |
| `DELETE` | `/api/subscriptions/cancel` | Cancel active subscription |
| `POST` | `/api/books/{id}/notify` | Get notified on book release |

### Admin *(requires admin role)*
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Platform statistics |
| `GET` | `/api/admin/users` | List all users |
| `POST` | `/api/admin/users/{id}/toggle-deactivate` | Activate / deactivate user |
| `PUT` | `/api/admin/users/{id}/subscription` | Update user subscription |
| `GET` | `/api/admin/payments` | All payment records |

---

## Subscription Tiers

| Tier | Access |
|---|---|
| **Free** | No book streaming |
| **Standard** | Stream books from **one** allowed series (configured in profile) |
| **Premium** | Unlimited access to all series |

---

## Book Series

The platform ships with three seeded series:

| ID | Series | Sample Titles |
|---|---|---|
| 1 | **Developer Series** | Git for Teams, React + TypeScript, Docker & DevOps, Local LLMs in Production |
| 2 | **Academic Series** | Java'nin Temelleri, Veri Yapilari ve Algoritmalar, Yapay Zeka ve Veri Madenciligi |
| 3 | **AI & Data Series** | Python for Data Analysis, Agentic AI for Engineers, Retrieval-Augmented Systems |

---

## Production Checklist

Before deploying to production, update your `.env`:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com
MAIL_MAILER=smtp
PAYMENT_WEBHOOK_SECRET=<real gateway signing secret>
SESSION_ENCRYPT=true
```

Also ensure:
- `php artisan config:cache` and `php artisan route:cache` are run after deploy
- A queue worker is running: `php artisan queue:work`
- A scheduler is running: `* * * * * php artisan schedule:run`
- Redis is available for optimal reading-progress performance

---

## Author

Books authored by **Prof. Dr. İsmail KIRBAŞ**.
