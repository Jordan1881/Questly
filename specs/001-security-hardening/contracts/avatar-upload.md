# Contract: Avatar upload hardening

## Endpoint

`POST /api/users/me/avatar`

**Auth**: Bearer JWT (`verifyToken`)

**Content-Type**: `multipart/form-data` with field `avatar`

## Limits

| Rule | Value |
|------|-------|
| Max body/file | 2 MB (`shared/avatarUploadLimits.json` → `maxBytes`) |
| Allowed MIME (client claim) | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Magic bytes | Must match one allowed image family |
| Min short side | Existing sharp/FE rule (≥400 px / `minSourcePx`) |

## Responses

| Case | Status | Body shape |
|------|--------|------------|
| Success | 200 | Existing profile payload with `avatarUrl` |
| Oversize (multer or pre-check) | 400 | `{ error: string }` mentioning 2 MB |
| Bad/missing file / bad magic / bad MIME | 400 | `{ error: string }` |
| Unauthenticated | 401 | Existing auth error |

## Headers

- If `Content-Length` is present and `> maxBytes` → 400 before full buffer
- If `Content-Length` is present and non-numeric → 400
- If `Content-Length` absent → continue; multer enforces `fileSize`
