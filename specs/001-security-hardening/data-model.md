# Data Model: Questly Security Hardening

No new database tables. Logical entities only:

## AvatarUploadLimits (shared JSON)

| Field | Type | Notes |
|-------|------|-------|
| `maxBytes` | number | `2097152` (2 MiB) |
| `maxMbLabel` | string | `"2 MB"` for UI copy |
| `allowedMime` | string[] | jpeg/png/webp/gif MIME types |
| `minSourcePx` | number | align with existing 400 / `MIN_SOURCE_PX` guidance |

## AvatarUploadRejection

| Field | Type | Notes |
|-------|------|-------|
| `reason` | enum | `too_large` \| `bad_content_length` \| `invalid_type` \| `invalid_magic` \| `too_small` |
| `httpStatus` | number | typically 400 |
| `message` | string | user-safe error |

## SecurityFinding (P3/P4 tracking)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Sonar key or review id |
| `severity` | enum | Critical/High/Major/Medium/Minor |
| `source` | enum | sonar \| review |
| `status` | enum | open \| fixed \| accepted |
| `location` | string | file/symbol |
| `notes` | string | accept rationale if any |
