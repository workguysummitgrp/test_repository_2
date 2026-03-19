---
project: "News Portal"
slug: "news-portal"
phase: "testing"
version: "1.0.0"
date: "2026-03-18"
status: "approved"
author: "SDLC Agent"
---

# Defect Report — News Portal

## 1. Summary

| Severity | Total | Open | Fixed | Verified |
|---|---|---|---|---|
| Critical | 0 | 0 | 0 | 0 |
| High | 0 | 0 | 0 | 0 |
| Medium | 4 | 0 | 0 | 4 |
| Low | 3 | 0 | 0 | 3 |
| **Total** | **7** | **0** | **0** | **7** |

**All defects resolved and verified. Zero open Critical or High severity defects.**

---

## 2. Defect Details

### DEF-001: Article excerpt not auto-generated when omitted

| Field | Value |
|---|---|
| **ID** | DEF-001 |
| **Title** | Article excerpt not auto-generated when omitted |
| **Severity** | Medium |
| **Status** | Verified |
| **Found In** | TC-001 (Integration) |
| **User Story** | US-001 |
| **Assignee** | Development Team |

**Reproduction Steps**:
1. POST `/api/v1/articles` with valid title, body, categoryId but no `excerpt` field
2. Inspect the created article object

**Expected Result**: System auto-generates an excerpt from the first 160 characters of the article body (strip HTML tags)

**Actual Result**: Excerpt field is `null` in the response and on the article card, causing empty excerpt on homepage listing

**Fix Applied**: Added auto-excerpt generation in article creation route — strips HTML, takes first 160 chars, appends "..."

**Verified**: 2026-03-18 — Excerpt auto-generated correctly when omitted

---

### DEF-002: Category deletion returns 500 instead of 409

| Field | Value |
|---|---|
| **ID** | DEF-002 |
| **Title** | Category deletion with articles returns 500 instead of 409 |
| **Severity** | Medium |
| **Status** | Verified |
| **Found In** | TC-013 (Integration) |
| **User Story** | US-005 |
| **Assignee** | Development Team |

**Reproduction Steps**:
1. Create a category "politics" with 5 articles assigned
2. Attempt to DELETE the category

**Expected Result**: 409 Conflict with message "Cannot delete category with existing articles. Reassign articles first."

**Actual Result**: 500 Internal Server Error due to unhandled Prisma foreign key constraint violation

**Fix Applied**: Added pre-check for associated articles count before deletion; returns 409 with descriptive message

**Verified**: 2026-03-18 — 409 returned with proper error message

---

### DEF-003: File upload exceeding limit returns 500 instead of 413

| Field | Value |
|---|---|
| **ID** | DEF-003 |
| **Title** | Upload size limit returns wrong HTTP status |
| **Severity** | Medium |
| **Status** | Verified |
| **Found In** | TC-048 (Integration) |
| **User Story** | US-019 |
| **Assignee** | Development Team |

**Reproduction Steps**:
1. Upload an image file > 10 MB to the media upload endpoint
2. Inspect the HTTP response

**Expected Result**: 413 Payload Too Large with message "File exceeds maximum size limit of 10 MB"

**Actual Result**: 500 Internal Server Error — S3 SDK throws unhandled error after partial upload attempt

**Fix Applied**: Added explicit `Content-Length` check in upload middleware before processing; returns 413 with human-readable message

**Verified**: 2026-03-18 — 413 returned, upload prevented early

---

### DEF-004: WhatsApp share URL malformed on desktop

| Field | Value |
|---|---|
| **ID** | DEF-004 |
| **Title** | WhatsApp share link uses incorrect protocol |
| **Severity** | Low |
| **Status** | Verified |
| **Found In** | TC-060 (E2E) |
| **User Story** | US-026 |
| **Assignee** | Development Team |

**Reproduction Steps**:
1. Navigate to any article page on desktop Chrome
2. Click the WhatsApp share button
3. Observe the URL opened

**Expected Result**: Opens `https://wa.me/?text={encoded_url}` which works on both desktop and mobile

**Actual Result**: Opens `whatsapp://send?text={encoded_url}` which only works when WhatsApp desktop app is installed

**Fix Applied**: Updated ShareButton component to use `https://wa.me/` URL format

**Verified**: 2026-03-18 — Share works on desktop browser via wa.me web redirect

---

### DEF-005: Pagination component shows page 0 on empty results

| Field | Value |
|---|---|
| **ID** | DEF-005 |
| **Title** | Pagination shows "Page 0 of 0" on empty search results |
| **Severity** | Low |
| **Status** | Verified |
| **Found In** | TC-028 (Integration) |
| **User Story** | US-012 |
| **Assignee** | Development Team |

**Reproduction Steps**:
1. Search for a term with no results (e.g., "xyznonexistent123")
2. Observe the pagination component

**Expected Result**: Pagination component is hidden when there are zero results

**Actual Result**: Pagination shows "Page 0 of 0" with disabled prev/next buttons

**Fix Applied**: Added early return in Pagination component when `totalPages <= 0`

**Verified**: 2026-03-18 — Pagination hidden on empty results

---

### DEF-006: Admin analytics endpoint missing period validation

| Field | Value |
|---|---|
| **ID** | DEF-006 |
| **Title** | Analytics endpoint accepts invalid period values |
| **Severity** | Medium |
| **Status** | Verified |
| **Found In** | TC-056 (Integration) |
| **User Story** | US-024 |
| **Assignee** | Development Team |

**Reproduction Steps**:
1. GET `/api/v1/admin/analytics?period=invalid_value`
2. Inspect response

**Expected Result**: 400 Bad Request with valid period options (24h, 7d, 30d, 90d)

**Actual Result**: Defaults silently to all-time data without informing the client

**Fix Applied**: Added Zod enum validation for period parameter; returns 400 with allowed values on invalid input

**Verified**: 2026-03-18 — 400 returned for invalid period with clear message

---

### DEF-007: Article card truncates title mid-word on mobile

| Field | Value |
|---|---|
| **ID** | DEF-007 |
| **Title** | Article title truncation breaks mid-word on small screens |
| **Severity** | Low |
| **Status** | Verified |
| **Found In** | TC-050 (E2E) |
| **User Story** | US-021 |
| **Assignee** | Development Team |

**Reproduction Steps**:
1. View homepage on 375px viewport with articles that have long titles (80+ chars)
2. Observe title rendering

**Expected Result**: Title truncated at word boundary with ellipsis (CSS `line-clamp`)

**Actual Result**: Title cuts off mid-word due to `overflow: hidden` without `line-clamp`

**Fix Applied**: Applied `line-clamp-2` and `text-ellipsis` Tailwind utilities to ArticleCard title

**Verified**: 2026-03-18 — Titles truncate at word boundary with "..." suffix

---

## 3. Defect Trend

```
Day 1-2 (Unit/Integration):  3 defects found (DEF-001, DEF-002, DEF-006)
Day 3-4 (E2E):               3 defects found (DEF-003, DEF-004, DEF-007)
Day 4-5 (Security/Perf):     0 defects found
Day 5   (Accessibility):     0 defects found
Day 5   (Retesting):         1 defect found (DEF-005, found during retest)
Day 6   (Fix verification):  All 7 verified closed
```

## 4. Risk Assessment

- **No Critical or High defects** — release is not blocked
- All 4 Medium defects relate to error handling and input validation edge cases — all fixed and verified
- All 3 Low defects are cosmetic/UX issues — all fixed and verified
- Security testing found **zero defects** — security controls are robust
- Performance testing found **zero defects** — all thresholds met
