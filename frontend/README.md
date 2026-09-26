# ChinVerse Frontend

Next.js frontend for the ChinVerse Persian/Chinese learning app.

## Development

```powershell
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Checks

```powershell
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

## Notes

- API calls use the backend URL configured in `.env.local`.
- The production app registers a release-scoped service worker. It precaches only
  the standalone offline fallback and public shell assets; API, account, upload,
  and private-media paths are never written to Cache Storage.
- Run the PWA lifecycle tests against a production build with
  `PLAYWRIGHT_SERVER_MODE=production npm run test:e2e -- phase6-pwa.spec.ts`.
