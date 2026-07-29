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
- The web manifest and install icons are present. Offline service-worker support
  is intentionally disabled until it is reintroduced with a maintained Next.js
  integration and dedicated cache-update tests.
