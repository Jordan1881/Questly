# Questly — Submission Package (M8)

## Repository

https://github.com/Jordan1881/Questly

## Production

| Service | URL |
|---------|-----|
| Frontend | https://questly-gilt.vercel.app |
| API | https://questly-production-f5ba.up.railway.app |

## Deliverables

| Item | Location |
|------|----------|
| Source code | GitHub repo (this repository) |
| Documentation index | [docs/README.md](./README.md) |
| API documentation | [docs/API.md](./API.md) |
| ER diagram | [docs/questly-schema.mermaid](./questly-schema.mermaid) |
| Project write-up | [docs/WRITEUP.md](./WRITEUP.md) |
| Presentation overview | [docs/PROJECT-OVERVIEW.md](./PROJECT-OVERVIEW.md) |
| Demo script | [docs/DEMO.md](./DEMO.md) |
| UI screenshots | [docs/screenshots/](./screenshots/) |
| E2E tests | `e2e/journey-*.spec.js` (5 journeys) |
| CI pipeline | `.github/workflows/ci.yml` |

## Test commands

```bash
cd server && npm run migrate:test && npm test
npm run test:coverage
npx playwright test --pass-with-no-tests
```

## Sprint completion

- **S12:** E2E journeys 3–5, security, edge-case, performance tests
- **S13:** Concurrency, coverage CI artifacts, documentation, submission package

## Demo video

**Status:** recording pending. Record using the [demo walkthrough](./DEMO.md), upload the final video, and replace this sentence with the public or institution-accessible URL before submission.
