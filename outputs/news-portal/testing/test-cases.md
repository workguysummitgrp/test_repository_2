---
project: "News Portal"
slug: "news-portal"
phase: "testing"
version: "1.0.0"
date: "2026-03-18"
status: "approved"
author: "SDLC Agent"
---

# Test Cases — News Portal

## 1. Overview

This document catalogs all test cases for the News Portal platform. Each test case maps to one or more user stories (US-001 through US-030) and includes type, steps, expected results, and priority.

**Total Test Cases: 85**

| Test Type | Count |
|---|---|
| Unit | 25 |
| Integration | 22 |
| E2E | 15 |
| Security | 10 |
| Performance | 7 |
| Accessibility | 6 |
| **Total** | **85** |

---

## 2. Article Management (US-001 — US-004)

### TC-001: Create article with valid data
- **User Story**: US-001
- **Type**: Integration
- **Priority**: P1
- **Precondition**: Logged in as editor
- **Steps**:
  1. POST `/api/v1/articles` with title, body, categoryId, tags, excerpt
  2. Verify 201 response with article object
- **Expected**: Article created with status "draft", slug auto-generated, author set to current user

### TC-002: Create article — missing required fields
- **User Story**: US-001
- **Type**: Unit
- **Priority**: P1
- **Steps**:
  1. Validate payload with missing `title` or `body` against `createArticleSchema`
- **Expected**: Zod validation fails with descriptive error messages

### TC-003: Create article — title max length
- **User Story**: US-001
- **Type**: Unit
- **Priority**: P2
- **Steps**:
  1. Validate payload with title > 200 characters
- **Expected**: Validation rejects with max length error

### TC-004: Create article — reader role rejected
- **User Story**: US-001
- **Type**: Integration
- **Priority**: P1
- **Precondition**: Logged in as reader
- **Steps**:
  1. POST `/api/v1/articles` with valid payload
- **Expected**: 403 Forbidden — readers cannot create articles

### TC-005: Edit article — author can update
- **User Story**: US-002
- **Type**: Integration
- **Priority**: P1
- **Precondition**: Logged in as editor who authored the article
- **Steps**:
  1. PUT `/api/v1/articles/{slug}` with updated title and body
  2. Verify response contains updated fields
- **Expected**: Article updated, revision created in history

### TC-006: Edit article — non-author editor rejected
- **User Story**: US-002
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. PUT `/api/v1/articles/{slug}` as a different editor (not author, not admin)
- **Expected**: 403 Forbidden

### TC-007: Edit article — admin can update any
- **User Story**: US-002
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. PUT `/api/v1/articles/{slug}` as admin on another editor's article
- **Expected**: 200 OK — admin override

### TC-008: Delete article — soft delete with recovery
- **User Story**: US-003
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. DELETE `/api/v1/articles/{slug}` as article author
  2. Verify article has `deletedAt` timestamp
  3. Verify article no longer appears in public listing
- **Expected**: Soft-delete; article recoverable for 30 days

### TC-009: Preview article before publish
- **User Story**: US-004
- **Type**: E2E
- **Priority**: P2
- **Steps**:
  1. Navigate to article editor
  2. Enter article content
  3. Click "Preview" button
- **Expected**: Preview renders article exactly as readers would see it

### TC-010: Slugify function correctness
- **User Story**: US-001
- **Type**: Unit
- **Priority**: P2
- **Steps**:
  1. Test slugify with various inputs: spaces, special chars, unicode, leading/trailing whitespace
- **Expected**: Correctly converts to kebab-case, strips special chars, collapses hyphens

---

## 3. Category & Tag Management (US-005 — US-006)

### TC-011: Create category — admin only
- **User Story**: US-005
- **Type**: Integration
- **Priority**: P2
- **Precondition**: Logged in as admin
- **Steps**:
  1. POST `/api/v1/categories` with name and slug
- **Expected**: 201 Created with category object

### TC-012: Create category — non-admin rejected
- **User Story**: US-005
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/categories` as editor
- **Expected**: 403 Forbidden

### TC-013: Delete category with articles — blocked
- **User Story**: US-005
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. Attempt to delete a category that has associated articles
- **Expected**: 409 Conflict — cannot delete category with articles

### TC-014: Tag auto-suggest on article creation
- **User Story**: US-006
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Open article editor, type in tags field
  2. Verify auto-complete suggestions appear
- **Expected**: Existing matching tags shown as suggestions

### TC-015: Create new tag via article save
- **User Story**: US-006
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. POST article with a tag name that doesn't exist
- **Expected**: Tag created and linked to article via ArticleTag join

---

## 4. Authentication & Registration (US-007 — US-009)

### TC-016: Register with valid credentials
- **User Story**: US-007
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/auth/register` with valid email, password (8+ chars, uppercase, number), displayName
- **Expected**: 201 Created, user account with reader role, password hashed with bcrypt(12)

### TC-017: Register — duplicate email anti-enumeration
- **User Story**: US-007
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. Register with an already-registered email
  2. Inspect response body and timing
- **Expected**: Generic success-like response (no indication whether email exists), consistent response time

### TC-018: Register — weak password rejected
- **User Story**: US-007
- **Type**: Unit
- **Priority**: P1
- **Steps**:
  1. Validate passwords: no uppercase, no number, < 8 chars
- **Expected**: Registration schema rejects all weak variants

### TC-019: Login with valid credentials
- **User Story**: US-008
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST login with correct email/password
- **Expected**: JWT token issued, redirect to home feed

### TC-020: Login — account lockout after 5 failures
- **User Story**: US-008
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. Attempt login with wrong password 5 times
  2. 6th attempt with correct password
- **Expected**: Account locked for 30 minutes after 5th failure; 6th attempt returns lockout error

### TC-021: Account lockout — expiry
- **User Story**: US-008
- **Type**: Unit
- **Priority**: P2
- **Steps**:
  1. Test `isAccountLocked()` with expired `lockedUntil` timestamp
- **Expected**: Account is not locked after expiry period

### TC-022: Password reset flow
- **User Story**: US-009
- **Type**: E2E
- **Priority**: P2
- **Steps**:
  1. Click "Forgot Password" on login page
  2. Enter registered email
  3. Verify reset link sent (mock email)
  4. Click reset link, enter new password
- **Expected**: Password updated successfully, old password no longer works

---

## 5. Personalized Feed (US-010 — US-011)

### TC-023: Set preferred categories
- **User Story**: US-010
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. PUT `/api/v1/users/me` with preferences JSON containing selected categories
- **Expected**: Preferences saved, home feed prioritizes selected categories

### TC-024: Default feed for new user
- **User Story**: US-010
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Log in as new user with no preferences
  2. View home page
- **Expected**: Feed shows articles ordered by recency and editorial priority

### TC-025: Personalized recommendations
- **User Story**: US-011
- **Type**: Integration
- **Priority**: P3
- **Steps**:
  1. Simulate user with 5+ read articles in "politics" category
  2. Fetch home feed
- **Expected**: "For You" section contains politics-related articles

### TC-026: Trending articles for new users
- **User Story**: US-011
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Log in as user with no reading history
  2. Check "For You" section
- **Expected**: Displays trending articles (highest view count)

---

## 6. Search & Filtering (US-012 — US-013)

### TC-027: Full-text search with highlighting
- **User Story**: US-012
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. GET `/api/v1/search?q=climate+change`
- **Expected**: Results returned with matched terms highlighted via `ts_headline`, sorted by relevance

### TC-028: Search — no results
- **User Story**: US-012
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. GET `/api/v1/search?q=xyznonexistent123`
- **Expected**: Empty results array, 200 OK

### TC-029: Search with category filter
- **User Story**: US-013
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. GET `/api/v1/search?q=news&category=politics`
- **Expected**: Only articles in "politics" category returned

### TC-030: Search — SQL injection attempt
- **User Story**: US-012
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. GET `/api/v1/search?q=' OR 1=1 --`
- **Expected**: Query safely parameterized, no data leakage, normal error or empty results

---

## 7. Comments (US-014 — US-015)

### TC-031: Post comment — authenticated user
- **User Story**: US-014
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/comments` with articleId and body as authenticated user
- **Expected**: 201 Created, comment appears in article thread

### TC-032: Post comment — unauthenticated rejected
- **User Story**: US-014
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/comments` without auth token
- **Expected**: 401 Unauthorized

### TC-033: Comment nesting — max 1 level
- **User Story**: US-014
- **Type**: Unit
- **Priority**: P2
- **Steps**:
  1. Test `canReply()` with depth=0 (top-level), depth=1 (reply), depth=2 (nested reply)
- **Expected**: Depth 0 and 1 allowed, depth 2 blocked

### TC-034: Comment validation — empty body rejected
- **User Story**: US-014
- **Type**: Unit
- **Priority**: P1
- **Steps**:
  1. Validate comment with empty body
- **Expected**: Zod schema rejects

### TC-035: Comment validation — body > 5000 chars
- **User Story**: US-014
- **Type**: Unit
- **Priority**: P2
- **Steps**:
  1. Validate comment with body exceeding 5000 characters
- **Expected**: Zod schema rejects

### TC-036: Moderate comment — flag flow
- **User Story**: US-015
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. Flag a comment as "spam" by authenticated user
  2. Verify comment status changes to "flagged"
- **Expected**: Comment status = flagged, appears in moderation queue

### TC-037: Moderate comment — approve flagged
- **User Story**: US-015
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. As moderator, approve a flagged comment
- **Expected**: Comment status returns to "active", flag resolved

### TC-038: Moderate comment — remove
- **User Story**: US-015
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. As moderator, remove a flagged comment
- **Expected**: Comment status = "removed", hidden from public view

### TC-039: Comment moderation state machine
- **User Story**: US-015
- **Type**: Unit
- **Priority**: P2
- **Steps**:
  1. Test all valid/invalid state transitions: active→flagged, flagged→active, removed→active
- **Expected**: Valid transitions succeed, invalid transitions (e.g., removed→active) blocked

---

## 8. Editorial Workflow (US-016 — US-018)

### TC-040: Submit article for review
- **User Story**: US-016
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/articles/{id}/submit` as article author (editor)
- **Expected**: Article status changes to "in_review"

### TC-041: Submit — non-editor rejected
- **User Story**: US-016
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/articles/{id}/submit` as reader
- **Expected**: 403 Forbidden

### TC-042: Approve article — reviewer role
- **User Story**: US-017
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/articles/{id}/approve` as reviewer
- **Expected**: Article status changes to "approved"

### TC-043: Reject article — feedback required
- **User Story**: US-017
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/articles/{id}/reject` without feedback field
- **Expected**: 400 Bad Request — feedback is required

### TC-044: Reject article — with feedback
- **User Story**: US-017
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/articles/{id}/reject` with feedback text
- **Expected**: Article status returns to "draft", feedback attached, editor notified

### TC-045: Approve — editor role rejected
- **User Story**: US-017
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. POST `/api/v1/articles/{id}/approve` as editor
- **Expected**: 403 Forbidden — editors cannot approve (reviewer+ required)

### TC-046: Schedule article publication
- **User Story**: US-018
- **Type**: E2E
- **Priority**: P2
- **Steps**:
  1. Set `scheduledAt` on approved article to future date
  2. Verify article not visible before scheduled time
- **Expected**: Article publishes at scheduled time

---

## 9. Media Management (US-019 — US-020)

### TC-047: Upload image — valid format
- **User Story**: US-019
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. Upload JPEG image (5 MB) via media endpoint
- **Expected**: Image uploaded, resized, URL returned

### TC-048: Upload — exceeds size limit
- **User Story**: US-019
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. Upload image > 10 MB
- **Expected**: 413 Payload Too Large with clear error message

### TC-049: Media library pagination
- **User Story**: US-020
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Open media library with 50+ items
  2. Navigate between pages
- **Expected**: Paginated grid with search and type filters

---

## 10. Responsive Design (US-021)

### TC-050: Mobile layout (< 768px)
- **User Story**: US-021
- **Type**: E2E
- **Priority**: P2
- **Steps**:
  1. Load homepage at 375px viewport
  2. Verify hamburger menu, full-width cards, touch targets
- **Expected**: Mobile-optimized layout with no horizontal scroll

### TC-051: Tablet layout (768–1024px)
- **User Story**: US-021
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Load homepage at 768px viewport
- **Expected**: 2-column article grid with adapted navigation

### TC-052: Feature parity on mobile
- **User Story**: US-021
- **Type**: E2E
- **Priority**: P2
- **Steps**:
  1. Execute core actions on 375px viewport: search, read article, post comment
- **Expected**: All features functional, no functionality lost

---

## 11. Admin Dashboard (US-022 — US-023)

### TC-053: Change user role — admin
- **User Story**: US-022
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. PUT `/api/v1/admin/users` to change user role from reader to editor
- **Expected**: Role updated, new permissions effective immediately

### TC-054: Change user role — non-admin rejected
- **User Story**: US-022
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. PUT `/api/v1/admin/users` as editor
- **Expected**: 403 Forbidden

### TC-055: System health dashboard
- **User Story**: US-023
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Login as admin, navigate to admin dashboard
- **Expected**: Real-time metrics displayed: active users, articles published today, pending reviews, flagged comments

---

## 12. Analytics (US-024 — US-025)

### TC-056: Article performance metrics
- **User Story**: US-024
- **Type**: Integration
- **Priority**: P3
- **Steps**:
  1. GET `/api/v1/admin/analytics?period=7d`
- **Expected**: Returns views, unique visitors, engagement metrics filtered by period

### TC-057: Analytics — non-admin rejected
- **User Story**: US-024
- **Type**: Integration
- **Priority**: P1
- **Steps**:
  1. GET `/api/v1/admin/analytics` as editor
- **Expected**: 403 Forbidden

### TC-058: User engagement tracking
- **User Story**: US-025
- **Type**: Integration
- **Priority**: P3
- **Steps**:
  1. GET `/api/v1/admin/analytics` with engagement metrics
- **Expected**: DAU/MAU, registrations, retention data returned

---

## 13. Social Sharing (US-026)

### TC-059: Open Graph meta tags
- **User Story**: US-026
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Load article page, inspect HTML meta tags
- **Expected**: og:title, og:description, og:image, og:url present and correct

### TC-060: Share button functionality
- **User Story**: US-026
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Click share buttons (Facebook, Twitter/X, LinkedIn)
- **Expected**: Share dialog opens pre-populated with article title and URL

---

## 14. Notifications (US-027 — US-028)

### TC-061: Breaking news notification trigger
- **User Story**: US-027
- **Type**: Integration
- **Priority**: P3
- **Steps**:
  1. Publish article with "Breaking News" flag
- **Expected**: Notification dispatched to users with breaking news enabled

### TC-062: Newsletter subscription
- **User Story**: US-028
- **Type**: Integration
- **Priority**: P3
- **Steps**:
  1. Enable "Weekly Newsletter" in user settings
  2. Verify subscription record created
- **Expected**: User added to newsletter list

### TC-063: Newsletter unsubscribe
- **User Story**: US-028
- **Type**: E2E
- **Priority**: P3
- **Steps**:
  1. Click unsubscribe link in email footer
- **Expected**: User removed from newsletter list, confirmation shown

---

## 15. Bookmarks (US-029)

### TC-064: Bookmark an article
- **User Story**: US-029
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. POST `/api/v1/users/me/bookmarks` with articleId
- **Expected**: 201 Created, article added to user's bookmarks

### TC-065: List bookmarks
- **User Story**: US-029
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. GET `/api/v1/users/me/bookmarks`
- **Expected**: Returns paginated list of bookmarked articles

### TC-066: Remove bookmark
- **User Story**: US-029
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. DELETE bookmark by ID
- **Expected**: Bookmark removed, no longer in list

---

## 16. Profile Management (US-030)

### TC-067: View profile
- **User Story**: US-030
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. GET `/api/v1/users/me` as authenticated user
- **Expected**: Returns user profile with displayName, email, avatar, bio, preferences

### TC-068: Update profile
- **User Story**: US-030
- **Type**: Integration
- **Priority**: P2
- **Steps**:
  1. PUT `/api/v1/users/me` with updated displayName and bio
- **Expected**: Profile updated, changes reflected immediately

### TC-069: Update email — verification required
- **User Story**: US-030
- **Type**: E2E
- **Priority**: P2
- **Steps**:
  1. Change email address in profile
- **Expected**: Verification email sent to new address; change effective only after verification

---

## 17. Security Test Cases

### TC-070: SQL injection — search endpoint
- **User Story**: US-012
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. Send SQL injection payloads to `/api/v1/search?q=`
  2. Payloads: `' OR 1=1 --`, `'; DROP TABLE articles; --`, `" UNION SELECT * FROM users --`
- **Expected**: All queries safely parameterized via Prisma, no data leakage

### TC-071: XSS — comment body
- **User Story**: US-014
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. POST comment with body containing script tags
  2. Load article page and verify rendering
- **Expected**: Script tags escaped/sanitized, not executed in browser

### TC-072: XSS — article title
- **User Story**: US-001
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. Create article with title containing HTML event handlers
  2. View article listing
- **Expected**: HTML entities escaped, no script execution

### TC-073: CSRF protection
- **User Story**: US-001, US-014
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. Attempt state-changing requests without proper CSRF token
- **Expected**: Requests rejected or JWT-based auth provides CSRF protection

### TC-074: JWT validation
- **User Story**: US-008
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. Send request with expired JWT
  2. Send request with tampered JWT payload
  3. Send request with invalid JWT signature
- **Expected**: All invalid tokens rejected with 401

### TC-075: Rate limiting — login endpoint
- **User Story**: US-008
- **Type**: Security
- **Priority**: P2
- **Steps**:
  1. Send 50 login requests in 1 minute
- **Expected**: Rate limiting engages, returns 429 Too Many Requests

### TC-076: Security headers verification
- **User Story**: All
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. Inspect response headers for all pages
- **Expected**: CSP, HSTS (max-age=63072000), X-Frame-Options (DENY), X-Content-Type-Options (nosniff) present

### TC-077: RBAC hierarchy enforcement
- **User Story**: US-001, US-017, US-022
- **Type**: Security
- **Priority**: P1
- **Steps**:
  1. Test each role (reader, moderator, editor, reviewer, admin) against all protected endpoints
- **Expected**: Role hierarchy enforced: reader(0) < moderator(1) < editor(2) < reviewer(3) < admin(4)

---

## 18. Performance Test Cases

### TC-078: Homepage load time
- **User Story**: US-021
- **Type**: Performance
- **Priority**: P2
- **Steps**:
  1. k6 load test: 100 VUs, 5 minutes, GET `/`
- **Expected**: P95 response time < 500ms, error rate < 1%

### TC-079: Article detail page load
- **User Story**: US-002
- **Type**: Performance
- **Priority**: P2
- **Steps**:
  1. k6 load test: 100 VUs, GET `/articles/{slug}`
- **Expected**: P95 < 500ms (ISR cached), P95 < 1000ms (cache miss)

### TC-080: Search endpoint throughput
- **User Story**: US-012
- **Type**: Performance
- **Priority**: P2
- **Steps**:
  1. k6 load test: 100 VUs, GET `/api/v1/search?q=news`
- **Expected**: P95 < 500ms with PostgreSQL tsvector index

### TC-081: Article creation under load
- **User Story**: US-001
- **Type**: Performance
- **Priority**: P3
- **Steps**:
  1. k6 load test: 50 VUs, POST `/api/v1/articles`
- **Expected**: P95 < 800ms including DB write and cache invalidation

### TC-082: Concurrent comment submission
- **User Story**: US-014
- **Type**: Performance
- **Priority**: P3
- **Steps**:
  1. k6 load test: 100 VUs, POST `/api/v1/comments`
- **Expected**: P95 < 500ms, no race conditions on comment count

### TC-083: Database connection pool
- **User Story**: All
- **Type**: Performance
- **Priority**: P2
- **Steps**:
  1. Sustained 200 VU load for 10 minutes
- **Expected**: No connection pool exhaustion, Prisma handles reconnection

### TC-084: Redis cache hit ratio
- **User Story**: All
- **Type**: Performance
- **Priority**: P3
- **Steps**:
  1. Monitor cache hit/miss ratio during load test
- **Expected**: Cache hit ratio > 80% for read-heavy endpoints

---

## 19. Accessibility Test Cases

### TC-085: Homepage — axe-core audit
- **User Story**: US-021
- **Type**: Accessibility
- **Priority**: P2
- **Steps**:
  1. Run axe-core on `/` at desktop, tablet, and mobile viewports
- **Expected**: Zero critical or serious violations (WCAG 2.1 AA)

### TC-086: Article page — keyboard navigation
- **User Story**: US-021
- **Type**: Accessibility
- **Priority**: P2
- **Steps**:
  1. Navigate article page using only keyboard (Tab, Enter, Escape)
- **Expected**: All interactive elements reachable, visible focus indicators

### TC-087: Login form — screen reader
- **User Story**: US-008
- **Type**: Accessibility
- **Priority**: P2
- **Steps**:
  1. Navigate login form with screen reader
- **Expected**: All form fields have associated labels, error messages announced

### TC-088: Color contrast ratio
- **User Story**: US-021
- **Type**: Accessibility
- **Priority**: P2
- **Steps**:
  1. Verify text/background contrast across all pages
- **Expected**: Minimum 4.5:1 for normal text, 3:1 for large text (WCAG AA)

### TC-089: Image alt text
- **User Story**: US-019, US-021
- **Type**: Accessibility
- **Priority**: P3
- **Steps**:
  1. Verify all images have descriptive alt attributes
- **Expected**: No images without alt text; decorative images use `alt=""`

### TC-090: Focus management on modals
- **User Story**: US-003, US-022
- **Type**: Accessibility
- **Priority**: P3
- **Steps**:
  1. Open delete confirmation modal
  2. Verify focus trapped within modal
  3. Close modal, verify focus returns to trigger
- **Expected**: Focus trap active, focus restored on close

---

## 20. User Story Coverage Summary

| User Story | Test Cases | Types Covered |
|---|---|---|
| US-001 | TC-001, TC-002, TC-003, TC-004, TC-010, TC-072, TC-073, TC-077, TC-081 | Unit, Integration, Security, Performance |
| US-002 | TC-005, TC-006, TC-007, TC-079 | Integration, Performance |
| US-003 | TC-008, TC-090 | Integration, Accessibility |
| US-004 | TC-009 | E2E |
| US-005 | TC-011, TC-012, TC-013 | Integration |
| US-006 | TC-014, TC-015 | E2E, Integration |
| US-007 | TC-016, TC-017, TC-018 | Integration, Security, Unit |
| US-008 | TC-019, TC-020, TC-021, TC-074, TC-075, TC-087 | Integration, Unit, Security, Accessibility |
| US-009 | TC-022 | E2E |
| US-010 | TC-023, TC-024 | Integration, E2E |
| US-011 | TC-025, TC-026 | Integration, E2E |
| US-012 | TC-027, TC-028, TC-030, TC-070, TC-080 | Integration, Security, Performance |
| US-013 | TC-029 | Integration |
| US-014 | TC-031, TC-032, TC-033, TC-034, TC-035, TC-071, TC-073, TC-082 | Integration, Unit, Security, Performance |
| US-015 | TC-036, TC-037, TC-038, TC-039 | Integration, Unit |
| US-016 | TC-040, TC-041 | Integration |
| US-017 | TC-042, TC-043, TC-044, TC-045, TC-077 | Integration, Security |
| US-018 | TC-046 | E2E |
| US-019 | TC-047, TC-048, TC-089 | Integration, Accessibility |
| US-020 | TC-049 | E2E |
| US-021 | TC-050, TC-051, TC-052, TC-078, TC-085, TC-086, TC-088 | E2E, Performance, Accessibility |
| US-022 | TC-053, TC-054, TC-077, TC-090 | Integration, Security, Accessibility |
| US-023 | TC-055 | E2E |
| US-024 | TC-056, TC-057 | Integration |
| US-025 | TC-058 | Integration |
| US-026 | TC-059, TC-060 | E2E |
| US-027 | TC-061 | Integration |
| US-028 | TC-062, TC-063 | Integration, E2E |
| US-029 | TC-064, TC-065, TC-066 | Integration |
| US-030 | TC-067, TC-068, TC-069 | Integration, E2E |
