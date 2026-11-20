# Servora.Web

Servora yönetim arayüzü (Vite + React). API ayrı repoda çalışır (`Servora`).

## Gereksinimler

- Node.js 20+
- Çalışan Servora API (`http://localhost:5137` varsayılan)

## Kurulum

```bash
npm install
cp .env.example .env.development
npm run dev
```

Uygulama: `http://localhost:5173`

## Scripts

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run preview` | Build önizleme |

## Yapılandırma

`VITE_API_BASE_URL` — API taban adresi. Yerel geliştirmede `/api` bırak; Vite bunu `http://localhost:5137` adresine iletir.
