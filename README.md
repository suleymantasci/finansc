# FinansÇözüm — finanscozum.net

Profesyonel finans platformu. Canlı altın/borsa verileri, blog, hesaplama araçları.

## Yapı

```
client/   → Next.js 16 (Frontend)
backend/  → NestJS 11 (API)
```

## Kurulum

### Gereksinimler
- Node.js 22+
- pnpm 9+
- PostgreSQL 16+

### Backend
```bash
cd backend
cp .env.example .env   # .env'i düzenle
pnpm install
pnpm run migration:run
pnpm run seed
pnpm run start:dev
```

### Client
```bash
cd client
cp .env.example .env.local   # .env.local'ı düzenle
pnpm install
pnpm run dev
```

## Portlar
- Client: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/docs (dev only)
