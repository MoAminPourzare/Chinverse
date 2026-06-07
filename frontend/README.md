# ChinVerse Frontend

Next.js frontend for the ChinVerse Persian/Chinese learning app.

## Development

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Checks

```powershell
npm run lint
npm exec tsc -- --noEmit --incremental false
npm run build
```

## Notes

- API calls use the backend URL configured in `.env.local`.
- Production PWA output is enabled only when `NEXT_ENABLE_PWA=1`.
