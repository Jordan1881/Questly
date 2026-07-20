# הכנה למבחן הפרויקט — Questly

מסמך זה עונה על כל שאלות ההכנה למבחן, מקובץ לפי הנושאים, עם הפניות לקוד אמיתי בפרויקט.
המטרה: לכל שאלה יש תשובה מבוססת קוד שאפשר להדגים בזמן אמת. היכן שיש מגבלה — היא מצוינת בכנות יחד עם דרך ההרחבה.

הערה על סביבת בדיקות: הרצת בדיקות ה־backend זהה ל־CI מתבצעת עם `MULTI_WORKSPACE=false`
(ב־CI אין קובץ `.env`, ולכן הדגל כבוי). מקומית `server/.env` מדליק את הדגל, ולכן להרצה תואמת CI:
`cd server && MULTI_WORKSPACE=false npx jest`.

---

## א. הבנת המערכת והארכיטקטורה

**1. ארכיטקטורת המערכת והרכיבים המרכזיים.**
מונוליט מודולרי בשתי אפליקציות: Frontend ב־React 19 + Vite (תיקיית `src/`) ו־Backend Express 5 + PostgreSQL (תיקיית `server/`). התקשורת ב־REST תחת `/api` עם JWT. רכיבי ה־backend: `routes` (חיווט) → `controllers` (טיפול בבקשה) → `services` (לוגיקה עסקית) → `models` (גישה לנתונים ב־Knex). ראו [`server/app.js`](../server/app.js) ו־[`server/routes/index.js`](../server/routes/index.js).

**2. מדוע ארכיטקטורה זו ואילו חלופות נשקלו.**
בחרנו מונוליט מודולרי כי היקף הפרויקט (צוות של שניים, לוח זמנים אקדמי) לא מצדיק את התקורה של Microservices (תשתית, ניטור, טרנזקציות מבוזרות). חלופות שנשקלו: (א) מיקרו־שירותים — נדחו בגלל מורכבות תפעולית; (ב) Next.js פול־סטאק אחד — נדחה כי רצינו הפרדה ברורה בין SPA ל־API ופריסות נפרדות (Vercel/Railway). ראו סעיף "Architectural decisions" ב־[`README.md`](../README.md).

**3. האם המערכת בנויה בשכבות ומה אחריות כל שכבה.**
כן. Frontend: UI (`src/pages`, `src/components`) → state (`src/stores` Zustand) → גישת נתונים (`src/lib/api.js`). Backend: routes → controllers → services → models. הכללים העסקיים ב־services (למשל [`server/services/taskRewards.js`](../server/services/taskRewards.js)), הגישה לנתונים ב־models בלבד ([`server/models/task.js`](../server/models/task.js)).

**4. כיצד נשמרת ההפרדה בין UI, לוגיקה ונתונים.**
ה־UI לא קורא `fetch` ישירות — הוא עובר דרך stores שקוראים ל־`apiFetch` ([`src/stores/taskStore.js`](../src/stores/taskStore.js), [`src/lib/api.js`](../src/lib/api.js)). ב־backend ה־controllers לא כותבים SQL — רק ה־models ניגשים ל־DB דרך מופע Knex יחיד ([`server/config/db.js`](../server/config/db.js)).

**5. תרחיש מרכזי מקצה לקצה — השלמת משימה.**
המשתמש לוחץ "השלם" ב־`TaskList` → `taskStore` שולח `PATCH /api/tasks/:id/completion` → הראוט מפעיל `verifyToken` → `requireRole` → `requireWorkspaceContext` → `validateBody` → הבקר `updateCompletion` פותח טרנזקציה, מסמן assignment, מזכה XP/מטבעות דרך `taskRewards`, מעדכן streak, וכותב שורת audit ל־`xp_transactions`, והכל נשמר אטומית ומוחזר ל־UI. ראו [`server/controllers/tasks.js`](../server/controllers/tasks.js) (`updateCompletion`).

**6. אילו רכיבים תלויים זה בזה וכיצד נמנעת תלות חזקה מדי.**
ה־controllers תלויים ב־services וב־models דרך `require`. כדי להחליש תלות: (א) שכבת ה־models מבודדת את ה־DB; (ב) ה־services מקבלים `trx` כפרמטר (הזרקת תלות של הטרנזקציה); (ג) הוספנו דוגמת Dependency Injection מפורשת — `createTaskService({ taskAssignmentModel })` ([`server/services/taskService.js`](../server/services/taskService.js)) שמאפשרת החלפת המודל בבדיקה.

**7. החלפת בסיס הנתונים או ה־UI — מה ישתנה.**
החלפת DB: רק שכבת ה־models ו־`knexfile.js`/`config/db.js`; ה־controllers/services לא נוגעים ב־SQL. החלפת UI: ה־API יציב (חוזה REST עם DTOs), כך שאפשר להחליף את ה־SPA כולו בלי לגעת ב־backend.

**8. Monolith / Modular Monolith / Microservices.**
מונוליט מודולרי: תהליך Express יחיד עם מודול נפרד לכל דומיין (auth, tasks, workspaces, rewards, sprints, xp). מתאים להיקף כי הוא פשוט לפריסה ולדיבוג, עם הפרדת אחריות שתאפשר פיצול עתידי אם יידרש.

**9. החלטות ארכיטקטוניות שהשתנו במהלך הפיתוח.**
דוגמאות אמיתיות מהמיגרציות/היסטוריה: מעבר לייחודיות של משימות Jira לפי workspace במקום גלובלית ([`server/migrations/20260607000001_scope_tasks_jira_issue_unique.js`](../server/migrations/20260607000001_scope_tasks_jira_issue_unique.js)); הוספת שכבת `workspace_memberships` לריבוי־workspace מאחורי דגל ([`server/migrations/20260715000001_create_workspace_memberships.js`](../server/migrations/20260715000001_create_workspace_memberships.js)); מעבר מ־`xp_cost` ל־`coin_cost` בתגמולים.

**10. החיסרון המרכזי של הארכיטקטורה.**
כמונוליט, כל הרכיבים משתחררים ומתקמפלים יחד, ואין בידוד כשל/סקיילינג עצמאי לרכיב יחיד (למשל סנכרון Jira הכבד רץ באותו תהליך כמו ה־API). הפתרון העתידי: תור עבודה (worker) לסנכרון (מפורט ב־[`docs/PERFORMANCE.md`](./PERFORMANCE.md)).

---

## ב. תשתית האפליקציה

**11. כיצד נבנה שלד האפליקציה.**
Backend נוצר עם factory `createApp()` המרכיב middleware בסדר קבוע ([`server/app.js`](../server/app.js)); ה־entrypoint טוען `dotenv` ומאזין ([`server/index.js`](../server/index.js)). Frontend מרנדר `RouterProvider` בתוך `AppProviders` ([`src/main.jsx`](../src/main.jsx)).

**12. מבנה התיקיות וההיגיון.**
Backend מאורגן לפי שכבה (`controllers/`, `services/`, `models/`, `middleware/`, `lib/`, `migrations/`). Frontend מאורגן לפי תפקיד UI (`pages/`, `components/`, `design-system/`, `stores/`, `hooks/`, `lib/`, `overlays/`). ראו "Repository layout" ב־[`README.md`](../README.md).

**13. רכיבי תשתית משותפים (שגיאות, לוגים, הרשאות, ולידציה, נתונים).**
טיפול שגיאות מרכזי ([`server/middleware/errorHandler.js`](../server/middleware/errorHandler.js)); לוגים מובנים ([`server/lib/logger.js`](../server/lib/logger.js)); הרשאות ([`server/middleware/verifyToken.js`](../server/middleware/verifyToken.js), `requireRole.js`, `requireWorkspaceContext.js`); ולידציה ([`server/middleware/validate.js`](../server/middleware/validate.js) + [`server/validation/schemas.js`](../server/validation/schemas.js)); גישת נתונים ([`server/config/db.js`](../server/config/db.js)).

**14. ניהול הגדרות סביבה.**
קונפיג מרכזי עם ולידציה שנכשלת מהר אם חסר `JWT_SECRET` ([`server/config/index.js`](../server/config/index.js)); `.env` נטען פעם אחת; תבנית ב־[`.env.example`](../.env.example); בחירת DB לפי `NODE_ENV` ב־[`server/knexfile.js`](../server/knexfile.js).

**15. הפרדה בין פיתוח, בדיקות וייצור.**
ל־`knexfile.js` שלושה בלוקים: development / test / production (מסדי נתונים נפרדים `questly_dev`/`questly_test`/`questly_prod`, ובייצור `DATABASE_URL` + SSL). דגלי סביבה (`MULTI_WORKSPACE`, `JIRA_FALLBACK_ENABLED`) שולטים בהתנהגות.

**16. טיפול בשגיאות בלתי צפויות — מנגנון מרכזי.**
כל בקר עוטף ב־`try/catch` ומעביר `next(err)`; ה־`errorHandler` הופך לכדי `{ error }` עם קוד מתאים, ומתעד דרך הלוגר (5xx עם stack, 4xx כאזהרה). ב־frontend `apiFetch` מטפל ב־401 גלובלית (logout/session expired) ומפנה שגיאות ל־toast ([`src/AppProviders.jsx`](../src/AppProviders.jsx), [`src/lib/api.js`](../src/lib/api.js)).

**17. מה נרשם בלוגים וכיצד עוזר באיתור תקלה.**
`pino-http` רושם שיטה, נתיב, סטטוס, זמן תגובה, ו־`X-Request-Id` לכל בקשה; שגיאות שרת נרשמות עם stack. ה־`X-Request-Id` מאפשר לקשר בין בקשה בלקוח ללוג בשרת. סודות מנוטרלים בגבול הלוגר (`REDACT_PATHS` ב־[`server/lib/logger.js`](../server/lib/logger.js)) כדי שטוקנים/סיסמאות לא ידלפו.

**18. ספריות/Frameworks חיצוניים ומדוע.**
Express (HTTP), Knex + pg (בונה שאילתות + מיגרציות, בלי ORM כבד), jsonwebtoken (JWT), bcryptjs (האש סיסמאות), helmet/cors/express-rate-limit (אבטחה), pino/pino-http (לוגים), zod (ולידציה), multer/sharp + AWS S3 (העלאת אווטאר). Frontend: React, react-router, zustand, tailwind, gsap. ראו [`server/package.json`](../server/package.json) ו־[`package.json`](../package.json).

**19. כיצד נמנעת תלות מיותרת בספריות.**
העדפנו ספריות קטנות וממוקדות ולא פריימוורקים כוללניים; אין ORM (Knex בלבד); לקוח ה־Jira כתוב מעל `https` המובנה בלי SDK כבד ([`server/services/jiraClient.js`](../server/services/jiraClient.js)); ה־DI factory מאפשר להחליף מימוש בלי לכפות ספרייה.

**20. מה צריך מפתח חדש כדי להריץ.**
`git clone` → התקנת תלויות בשורש וב־`server/` → `docker compose up -d` (Postgres) → `cp .env.example server/.env` והגדרת `JWT_SECRET` → `cd server && npm run migrate` → הפעלת API (`npm run dev`) ו־Frontend (`npm run dev`). smoke: `curl :3001/api/health`. מפורט ב־[`README.md`](../README.md) וב־[`AGENTS.md`](../AGENTS.md).

**21. Dependency Injection — דוגמה ויתרון.**
כן, מימשנו דוגמה מפורשת: `createTaskService({ taskAssignmentModel })` ([`server/services/taskService.js`](../server/services/taskService.js)). הבקר הוא ה־composition root שמזריק את המודל האמיתי; בבדיקה מזריקים מודל מזויף בלי DB ([`server/tests/taskService.test.js`](../server/tests/taskService.test.js)). היתרון: בדיקתיות בבידוד, החלפת מקור נתונים, ותלות מפורשת. בנוסף, הזרקת `trx` ל־services היא DI קליל.

**22. מה מתבצע באתחול האפליקציה.**
Backend: טעינת `dotenv` → `createApp()` (helmet → cors → לוגר → json → routes → notFound → errorHandler) → `app.listen`, ובייצור הפעלת job דיווח נתונים אישיים ([`server/index.js`](../server/index.js)). Frontend: רישום GSAP → רינדור `AppProviders` + `RouterProvider` ([`src/main.jsx`](../src/main.jsx)).

---

## ג. מימוש טכני ואיכות הקוד

**23. הסבר שורה־אחר־שורה של פונקציה מרכזית.**
`updateCompletion` ([`server/controllers/tasks.js`](../server/controllers/tasks.js)): ולידציה → טעינת המשימה → בדיקת שייכות ל־workspace → בדיקת assignment → בדיקת "כבר הושלם" (409) → טרנזקציה שמסמנת השלמה אטומית (`markCompleted` שמעדכן רק אם `completed_at IS NULL`), מזכה XP/מטבעות, מעדכנת streak, וכותבת ל־audit. מומלץ להדגים חי.

**24. קטע קוד שאנחנו גאים בו.**
המימוש הקונקורנטי של רכישת תגמול ([`server/services/rewardPurchase.js`](../server/services/rewardPurchase.js)): נעילת שורת המשתמש (`FOR UPDATE`), הקצאת קופון עם `SKIP LOCKED` כדי שלא יינתן פעמיים, וחיוב יתרה אטומי — הכל בטרנזקציה. איכותי כי הוא נכון תחת מרוצים ומגובה בבדיקות ([`server/tests/concurrency.test.js`](../server/tests/concurrency.test.js)).

**25. קטע קוד שדורש שיפור.**
`updateCompletion` ארוך ומכיל תיאום עסקי שהיה עדיף בשירות ייעודי. השיפור: חילוץ ל־`taskCompletionService`, בדומה ל־`createTaskService` שכבר הצגנו — צמצום אחריות הבקר.

**26. מניעת כפילויות קוד.**
פונקציות DTO משותפות (`formatTask`), ריכוז בדיקות הרשאה ([`server/lib/workspaceAuth.js`](../server/lib/workspaceAuth.js)), עוזר pagination משותף ([`server/lib/pagination.js`](../server/lib/pagination.js)), ולידציה משותפת (schemas), ועוזרי בדיקה ([`server/tests/helpers/jiraNock.js`](../server/tests/helpers/jiraNock.js)).

**27. ולידציה של קלט משתמש — באיזו שכבה.**
בשכבת ה־HTTP לפני הבקר: middleware `validateBody(schema)` עם zod ([`server/middleware/validate.js`](../server/middleware/validate.js)) על login, השלמת משימה, ויצירת ספרינט. הבקרים שומרים בדיקות משלהם כ־defense-in-depth. הולידציה רצה אחרי אימות (401/403 קודמים ל־400).

**28. מה קורה בערך חסר / לא חוקי / מסוג לא צפוי.**
zod מחזיר 400 עם הודעה עקבית (למשל "completed must be a boolean"); הבקרים מטפלים ב־null/'' (`mapDateField` בספרינטים). ב־DB יש `NOT NULL`, enums, ו־clamping (`GREATEST(col-?,0)`) שמונע יתרות שליליות.

**29. פעולות אסינכרוניות — מה אם לא ממתינים.**
כל ה־I/O הוא `async/await`; פעולות רב־כתיבה עטופות בטרנזקציה. אי־המתנה עלול לגרום ל־race (זיכוי כפול, מרוץ יתרה) — לכן משתמשים בעדכון מותנה אטומי ובנעילות (`FOR UPDATE`), ויש בדיקות מרוץ ([`server/tests/concurrency.test.js`](../server/tests/concurrency.test.js), [`server/tests/balanceConsistency.test.js`](../server/tests/balanceConsistency.test.js)).

**30. טיפול במצבי קצה.**
דוגמאות: השלמה כפולה → 409; ספרינט פעיל כפול → 409 (אינדקס ייחודי חלקי); סנכרון Jira עם יותר מ־100 issues → pagination; כשל טוקן Jira → login עדיין עובד ([`server/tests/`] ורבים). כיסוי בדיקות רחב.

**31. עיקרון SOLID / תבנית תכנון.**
Single Responsibility בשכבות; Dependency Inversion ב־`createTaskService` (השירות תלוי בהפשטה, לא במודול קונקרטי); תבנית Middleware (ולידציה/הרשאה); תבנית Factory (`createApp`, `createTaskService`); Repository-like ב־models.

**32. באג משמעותי — איתור ותיקון.**
כשל בפענוח טוקן Jira מוצפן חסם התחברות. איתרנו דרך הלוגים/בדיקות ותיקנו כך שכשל פענוח לא מפיל login (commit `fix: keep login working when Jira token decrypt fails`), עם בדיקה ([`server/tests/`] בנושא jira token). ניתן להראות בהיסטוריית git.

**33. החוב הטכני הגדול ביותר.**
היגיון עסקי בתוך `updateCompletion` בבקר (ולא בשירות ייעודי) — מפורט בשאלה 25.

**34. שינויים אם היה חודש נוסף.**
חילוץ שירות השלמת משימה, הרחבת שכבת הולידציה לכל ה־endpoints, מעבר לתור עבודה לסנכרון Jira, ו־Redis למטמון/rate-limit לריבוי־nodes.

---

## ד. בסיס נתונים ושכבת הנתונים

**35. מודל הנתונים והישויות.**
ישויות מרכזיות: `workspaces`, `users`, `workspace_memberships`, `join_requests`, `sprints`, `tasks`, `task_assignments`, `rewards`, `reward_coupons`, `purchases`, `xp_transactions`, `xp_approval_requests`. הקשרים בדיאגרמה [`docs/questly-schema.mermaid`](./questly-schema.mermaid) ובמיגרציות `server/migrations/`.

**36. כיצד המבנה תומך בדרישות העסקיות.**
`task_assignments` עם `completed_at` פר־משתמש תומך במשימה משותפת; `xp_transactions` הוא ledger append-only לביקורת; אינדקס ייחודי חלקי מבטיח ספרינט פעיל יחיד ל־workspace; ייחודיות משימת Jira לפי workspace מונעת התנגשות בין דיירים.

**37. האם קיימות כפילויות מידע ואם הן מכוונות.**
כן, מכוונות: יתרות XP/מטבעות משוכפלות על `users` (ובריבוי־workspace על `workspace_memberships`) לצד ה־ledger `xp_transactions`. הדנורמליזציה נועדה לקריאה מהירה של יתרה, וה־ledger משמש כמקור אמת לביקורת.

**38. שמירת שלמות הנתונים.**
מפתחות זרים עם סמנטיקת מחיקה מכוונת (CASCADE/SET NULL/RESTRICT), אילוצי `UNIQUE`, `NOT NULL`, enums, `gen_random_uuid()` (pgcrypto), ותרגום שגיאת `23505` ל־409 ידידותי ([`server/controllers/sprints.js`](../server/controllers/sprints.js)).

**39. כשל באחת מכמה פעולות עדכון — Transaction.**
כן. כל פעולת רב־כתיבה עטופה ב־`db.transaction`: השלמת משימה, רכישת תגמול, סגירת ספרינט. אם צעד נכשל — rollback מלא, אין מצב חלקי.

**40. מניעת שאילתות לא יעילות / שליפת יתר.**
DTOs בוחרים עמודות מפורשות (`select(...)`), pagination אופציונלי עם `limit/offset` + `X-Total-Count` ([`server/lib/pagination.js`](../server/lib/pagination.js)), ואינדקסים על עמודות סינון.

**41. אילו אינדקסים ומדוע.**
ייחודיים חלקיים: ספרינט פעיל יחיד, אישור XP ממתין יחיד, ייחודיות Jira לפי workspace. אינדקסי חיפוש: `workspace_memberships(user_id,status)` ו־`(workspace_id,status)`. והוספנו אינדקסים משניים על `tasks.workspace_id`, `task_assignments.user_id`, `xp_transactions.user_id` ([`server/migrations/20260719000001_add_secondary_indexes.js`](../server/migrations/20260719000001_add_secondary_indexes.js)).

**42. ניהול שינויי סכמה — Migrations.**
כן, מיגרציות Knel עם `up`/`down` הפיכות בתיקיית `server/migrations/` (`npm run migrate`/`migrate:test`/`migrate:rollback`). חלק מהמיגרציות מבצעות גם backfill נתונים.

**43. עדכון מקבילי של אותו מידע.**
נעילות פסימיות (`FOR UPDATE`), `SKIP LOCKED` להקצאת קופון, ועדכון מותנה אטומי (`WHERE completed_at IS NULL`) שמונע זיכוי כפול. גיבוי נוסף: אינדקסים ייחודיים חלקיים. בדיקות: [`server/tests/concurrency.test.js`](../server/tests/concurrency.test.js).

**44. שאילתה מרכזית והסבר/שיפור.**
`TaskAssignmentModel.listForUser` ([`server/models/taskAssignment.js`](../server/models/taskAssignment.js)): join בין assignments ל־tasks, סינון לפי workspace, ו־left join רק לאישורי XP במצב pending (עם `andOnVal`). שיפור שכבר בוצע: `limit/offset` + אינדקס על `user_id`.

---

## ה. API ותקשורת בין רכיבים

**45. תכנון ממשקי ה־API.**
REST משאבי: קובץ ראוט לכל משאב תחת `/api` ([`server/routes/index.js`](../server/routes/index.js)), עם middleware עקבי (auth → role → workspace → validate → controller). מוסמך גם תחת `/api/v1`.

**46. בחירת Endpoints ופעולות HTTP.**
נתיבים משאביים (`/tasks`, `/workspaces/:id/sprints`); GET לקריאה, POST ליצירה/פעולה (`/sync`, `/close`, `/purchase`), PATCH לעדכון חלקי, DELETE להסרה. מפורט ב־[`docs/API.md`](./API.md).

**47. ההבדל בין GET/POST/PUT/PATCH/DELETE במערכת.**
GET קריאה בלבד; POST יצירה/טריגר; PATCH עדכון חלקי (בחרנו PATCH במקום PUT כי כל העדכונים חלקיים — למשל השלמת משימה); DELETE הסרה/ניתוק. PUT לא בשימוש בכוונה. טבלה ב־[`docs/API.md`](./API.md).

**48. החזרת קודי הצלחה/שגיאה.**
201 ביצירה, 200 בהצלחה, 400/401/403/404/409/503 לפי המצב, תמיד בפורמט `{ error }` דרך ה־handler המרכזי ([`server/middleware/errorHandler.js`](../server/middleware/errorHandler.js)).

**49. מניעת חשיפת מבנה ה־DB דרך ה־API.**
DTOs: `formatTask` ([`server/controllers/tasks.js`](../server/controllers/tasks.js)) ו־`stripSensitiveFields` ([`server/models/user.js`](../server/models/user.js)) ממפים ל־camelCase ומסירים עמודות פנימיות/סודיות. לעולם לא מחזירים שורת DB גולמית.

**50. Timeout / ניתוק / כשל שירות חיצוני.**
לקוח Jira עם timeout קשיח + retry עם backoff לכשלים חולפים ([`server/services/jiraClient.js`](../server/services/jiraClient.js)); כשלים ממופים ל־503/502 במקום להיתקע או 500. בדיקות: [`server/tests/jiraClient.reliability.test.js`](../server/tests/jiraClient.reliability.test.js).

**51. גרסאות ל־API ותאימות לאחור.**
כל ראוט מוגש גם תחת `/api` וגם `/api/v1` ([`server/app.js`](../server/app.js)). שינוי לא־תואם עתידי יישלח תחת `/api/v2` בעוד `/api` ו־`/api/v1` נשארים יציבים. מתועד ב־[`docs/API.md`](./API.md).

**52. מניעת שליפת כמות גדולה מדי של רשומות.**
pagination אופציונלי תואם־לאחור (`limit` עד 200, `offset`) עם `X-Total-Count` ([`server/lib/pagination.js`](../server/lib/pagination.js)); סנכרון Jira עובר עמוד־עמוד; leaderboard/xp-history עם `limit` תחום ([`server/controllers/users.js`](../server/controllers/users.js)).

**53. DTO ויתרונו על אובייקט הנתונים.**
כן, ראו שאלה 49. היתרון: ניתוק חוזה ה־API מהסכמה, יציבות מול שינויי DB, ומניעת דליפת שדות רגישים (password_hash, טוקני Jira).

---

## ו. אבטחת מידע והרשאות

**54. אימות המשתמש.**
JWT stateless: הנפקת טוקן ב־login (`signToken`) ואימות ב־middleware שגם טוען מחדש את המשתמש מה־DB בכל בקשה ([`server/controllers/auth.js`](../server/controllers/auth.js), [`server/middleware/verifyToken.js`](../server/middleware/verifyToken.js)). Login לפי email (לא username).

**55. Authentication מול Authorization.**
Authentication = מי אתה (JWT). Authorization = מה מותר לך (תפקיד admin/developer + חברות ב־workspace). ההרשאות נאכפות ב־server: `requireRole` ([`server/middleware/requireRole.js`](../server/middleware/requireRole.js)) וריכוז ב־[`server/lib/workspaceAuth.js`](../server/lib/workspaceAuth.js).

**56. היכן נבדקות הרשאות — האם בדיקת לקוח מספיקה.**
לא מספיקה. בדיקת הלקוח (`ProtectedRoute`) היא UX בלבד; האכיפה האמיתית ב־server על כל ראוט. בדיקות אבטחה מדגימות זאת ([`server/tests/security.test.js`](../server/tests/security.test.js)).

**57. שמירת סיסמאות ומדוע לא טקסט גלוי.**
bcrypt עם 12 סבבים ([`server/controllers/auth.js`](../server/controllers/auth.js)); `password_hash` לעולם לא מוחזר (`stripSensitiveFields`). טקסט גלוי אסור כי דליפת DB הייתה חושפת את כל הסיסמאות; hash חד־כיווני + salt מונע זאת.

**58. הגנה מפני SQL Injection.**
כל השאילתות פרמטריות דרך Knex; כל `raw` משתמש ב־`?` ולא בשרשור מחרוזות. בדיקת רגרסיה: הזרקה בפילטר מוחזרת בבטחה ([`server/tests/security.test.js`](../server/tests/security.test.js)).

**59. מניעת שינוי מזהה בבקשה (IDOR).**
הבקרים טוענים את האובייקט ואז מאמתים גישה ל־workspace שלו (`canAccessWorkspace`), ולא סומכים על ה־URL. cross-workspace מחזיר 403. בדיקות ייעודיות ([`server/tests/security.test.js`](../server/tests/security.test.js), [`server/tests/multiTenant.test.js`](../server/tests/multiTenant.test.js)).

**60. האם מידע רגיש מופיע בקוד/הגדרות/לוגים.**
לא. סודות רק ב־`process.env`; `.env` ב־gitignore; `.env.example` עם placeholders; הלוגר מנטרל טוקנים/סיסמאות (`REDACT_PATHS` ב־[`server/lib/logger.js`](../server/lib/logger.js)); טוקני Jira מוצפנים ב־AES-256-GCM ([`server/lib/jiraTokenCrypto.js`](../server/lib/jiraTokenCrypto.js)).

**61. בקשת API ישירה בלי ה־UI.**
עדיין מוגן: כל הראוטים דורשים JWT תקף + הרשאות; אין הסתמכות על ה־UI לאכיפה. helmet/cors/rate-limit מוסיפים הקשחה ([`server/app.js`](../server/app.js), [`server/middleware/rateLimit.js`](../server/middleware/rateLimit.js)).

**62. שלושת סיכוני האבטחה המשמעותיים ביותר.**
(1) חשיפת/דליפת טוקני Jira — מוקטן בהצפנה במנוחה ובנטרול בלוגים; (2) גישה חוצת־דייר (IDOR) — מוקטן בבדיקות הרשאה ב־server + בדיקות; (3) התקפות brute-force/credential stuffing על login — מוקטן ב־bcrypt + rate limiting. סיכון שיורי: תלות בשירות חיצוני (Jira) — מוקטן ב־timeout/retry.

---

## ז. ביצועים, אמינות ויכולת הרחבה

**63. צווארי בקבוק אפשריים.**
סנכרון Jira (network-bound), bcrypt ב־login (CPU, מכוון), ורשימות לא־חסומות (מוקטן ב־pagination + אינדקסים). מפורט ב־[`docs/PERFORMANCE.md`](./PERFORMANCE.md).

**64. מדידת זמני תגובה.**
`pino-http` מודד `responseTime` לכל בקשה עם `X-Request-Id` ([`server/app.js`](../server/app.js)). טבלת זמנים מייצגת ב־[`docs/PERFORMANCE.md`](./PERFORMANCE.md) (dashboard 5–10ms, login ~230ms בגלל bcrypt).

**65. פי־עשרה משתמשים.**
קריאות סקיילביליות (אינדקסים + pagination + scope); כתיבות נכונות תחת מרוץ (טרנזקציות + נעילות); ה־API stateless וניתן להרחבה אופקית. סנכרון Jira ידרוש תור. פירוט ב־[`docs/PERFORMANCE.md`](./PERFORMANCE.md).

**66. מה ניתן להרחיב ומה דורש תכנון מחדש.**
מתרחב: API (אופקי), קריאות DB (אינדקסים/replica), כתיבות (טרנזקציות). דורש תכנון מחדש: סנכרון Jira (→worker/queue), המטמון וה־rate-limit ה־in-process (→Redis) לריבוי־nodes. טבלה ב־[`docs/PERFORMANCE.md`](./PERFORMANCE.md).

**67. פעולות ארוכות שחוסמות.**
סנכרון Jira הוא הארוך; הוקשח ב־timeout/retry/pagination והוא admin-triggered ולא בנתיב החם. עתידי: העברה ל־worker רקע.

**68. Caching — מה מתאים ומה לא.**
מטמון TTL in-process ([`server/lib/cache.js`](../server/lib/cache.js)) על גילוי שדה story-points ב־Jira (משתנה נדיר, יקר לשליפה). לא ממטמנים מידע אמת (יתרות/XP/מצב משימה) — Postgres נשאר מקור האמת. מנוטרל בבדיקות לצורך דטרמיניזם.

**69. התאוששות מכשל ב־DB או שירות חיצוני.**
טרנזקציות עושות rollback במצב חלקי; קריאות Jira עם timeout/retry וממופות ל־5xx במקום להיתקע; probe מוכנות `GET /api/health/ready` בודק DB. בדיקות: [`server/tests/reliability.test.js`](../server/tests/reliability.test.js).

**70. היערכות לזמינות גבוהה.**
2+ עותקי API מאחורי load balancer (כבר stateless), Postgres מנוהל עם standby+failover, worker+queue לסנכרון, Redis משותף למטמון/rate-limit, והתראות על probe המוכנות. מפורט כ־future work ב־[`docs/PERFORMANCE.md`](./PERFORMANCE.md).

---

## ח. בדיקות ואיכות

**71. סוגי הבדיקות.**
Unit (services/lib/stores/hooks), Integration/API (Supertest מול Express + Postgres אמיתי), Component (React Testing Library), ו־E2E (Playwright). ~120 קבצי בדיקה. הגדרות: [`server/jest.config.js`](../server/jest.config.js), [`vitest.config.js`](../vitest.config.js), [`playwright.config.js`](../playwright.config.js).

**72. בדיקה אוטומטית והסבר מה היא בודקת.**
`server/tests/security.test.js` בודק שהזרקת SQL בפילטר מוחזרת בבטחה ושגישה חוצת־workspace מוחזרת 403. דוגמה נוספת חדשה: [`server/tests/jiraClient.reliability.test.js`](../server/tests/jiraClient.reliability.test.js) בודק timeout, retry על 5xx, אי־retry על 4xx, ו־pagination.

**73. כיצד נבחר מה לבדוק.**
עדיפות לזרימות קריטיות/רגישות (auth, כסף/XP, הרשאות, מרוצים) ולסף כיסוי נאכף; לקבצים קריטיים סף גבוה יותר ([`server/jest.config.js`](../server/jest.config.js)).

**74. בידוד תלות ב־DB/שירות חיצוני בבדיקת יחידה.**
Jira ממוקינן ב־`nock` ([`server/tests/helpers/jiraNock.js`](../server/tests/helpers/jiraNock.js)); ה־DI factory מאפשר הזרקת מודל מזויף בלי DB ([`server/tests/taskService.test.js`](../server/tests/taskService.test.js)); בדיקות integration משתמשות ב־DB בדיקות מבודד עם ניקוי בין בדיקות ([`server/tests/setup.js`](../server/tests/setup.js)).

**75. Mock מול רכיב אמיתי.**
Mock מחליף תלות בזמן בדיקה (מהיר, דטרמיניסטי, בלי רשת/DB) — למשל `nock` ל־Jira או מודל מזויף ל־service. רכיב אמיתי (Postgres בבדיקות integration) בודק את האינטגרציה בפועל. משתמשים בשניהם לפי מה שנבדק.

**76. דוגמה למצב קצה שנבדק.**
זיכוי כפול בהשלמה מקבילה — `markCompleted` מעדכן רק אם `completed_at IS NULL`, וקריאה כפולה מחזירה null → 409, נבדק ב־[`server/tests/concurrency.test.js`](../server/tests/concurrency.test.js).

**77. כשל בבדיקה — האם ניתן לפרוס.**
לא. ב־CI פריסה חסומה מאחורי הצלחת backend + frontend + E2E ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)); בדיקה נכשלת עוצרת את הפייפליין לפני deploy.

**78. חלקים שאינם מכוסים מספיק.**
זרימות OAuth מסוימות וכמה ענפי דיווח נתונים אישיים בכיסוי נמוך יחסית; חלק מ־UI האנימציה נבדק שטחית. סף הכיסוי נאכף גלובלית ולקבצים קריטיים.

---

## ט. ניהול קוד ועבודת צוות

**79. חלוקת העבודה.**
צוות של שניים בעבודת pair, עם בעלות ראשית לפי תחום: Or Moskowitz — Frontend/UI/UX/design-system; Yarden (Jordan) — Backend/DB/אבטחה/Jira/בדיקות. פירוט מלא ב־[`CONTRIBUTORS.md`](../CONTRIBUTORS.md).

**80. רכיב שכל אחד היה אחראי לו.**
Or: `src/pages`, `src/components`, `src/design-system`, אנימציות GSAP, overlays. Yarden: `server/controllers`, `server/services`, `server/models`, `server/migrations`, אינטגרציית Jira ו־CI. ראו [`CONTRIBUTORS.md`](../CONTRIBUTORS.md).

**81. אינטגרציה בין החלקים.**
דרך חוזה ה־API היציב: ה־Frontend צורך endpoints מתועדים ([`docs/API.md`](./API.md)) דרך `src/lib/api.js` ו־stores; אינטגרציה נבדקת ב־E2E (Playwright) שמריצה זרימות מלאות מסך→API→DB.

**82. אסטרטגיית Branching.**
GitHub Flow: ענפי `feat/*`, `fix/*` ו־PR ל־`main`, עם CI שרץ על כל PR. ניתן לראות מיזוגי PR רבים בהיסטוריה (`git log`).

**83. הודעת Commit איכותית.**
Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`, עם scope). דוגמאות בהיסטוריה: `feat(server): membership promote/demote...`, `fix: keep login working when Jira token decrypt fails`. גם ה־commit של קשיחות ההגשה בסגנון זה.

**84. טיפול בהתנגשויות מיזוג.**
נפתרו מקומית ב־rebase/merge של ענף ה־feature מול `main`, בדיקה שהבדיקות ירוקות, ואז מיזוג ב־PR. ניתן להדגים בהיסטוריית git.

**85. Code Review הדדי.**
כל PR נבדק על ידי בן הזוג ומגובה ב־CI כשומר סף (בדיקות/כיסוי) לפני מיזוג; Dependabot פותח PRs לעדכוני תלות. שינויים בתחום של אחד נבדקו על ידי בעל התחום.

**86. הבטחת הבנה משותפת של הארכיטקטורה.**
מסמכי ארכיטקטורה ([`README.md`](../README.md), [`docs/WRITEUP.md`](./WRITEUP.md), דיאגרמת ERD), עבודת pair, וסקירת קוד הדדית. מסמך זה ([`docs/EXAM-PREP.md`](./EXAM-PREP.md)) מרכז את ההבנה המשותפת.

---

## י. שאלות שינוי בזמן אמת (הדגמה חיה)

**87. איתור מקום טיפול בפעולה מרכזית והסבר מסלול הביצוע.**
נקודת מוצא: `PATCH /api/tasks/:id/completion` → [`server/routes/tasks.js`](../server/routes/tasks.js) → `updateCompletion` ב־[`server/controllers/tasks.js`](../server/controllers/tasks.js). להדגים את שרשרת ה־middleware והטרנזקציה.

**88. הוספת שדה חדש לישות קיימת — אילו שכבות.**
(1) מיגרציה ב־`server/migrations/`; (2) `server/models/<entity>.js` (select/insert); (3) הבקר וה־DTO (`formatTask`); (4) סכמת ולידציה אם רלוונטי; (5) ב־Frontend: ה־store וה־component המציג. מסלול ברור וניתן להדגמה.

**89. הוספת כלל ולידציה קטן ובדיקתו.**
להוסיף שדה לסכמה ב־[`server/validation/schemas.js`](../server/validation/schemas.js) (למשל אורך מינימלי), ולהוסיף מקרה ל־[`server/tests/validate.test.js`](../server/tests/validate.test.js). הודעת השגיאה מוחזרת ב־400 דרך `validateBody`.

**90. שינוי הודעת שגיאה או קוד סטטוס — היכן.**
בבקר הרלוונטי או בסכמת הולידציה; הפורמט האחיד `{ error }` נקבע ב־[`server/middleware/errorHandler.js`](../server/middleware/errorHandler.js). לדוגמה, לשנות את "completed must be a boolean" ב־[`server/validation/schemas.js`](../server/validation/schemas.js).

**91. הוספת רישום לוג לפעולה בלי לחשוף מידע רגיש.**
להשתמש ב־`req.log.info({ ... })` (pino), כאשר שדות רגישים מנוטרלים אוטומטית לפי `REDACT_PATHS` ב־[`server/lib/logger.js`](../server/lib/logger.js). להדגים הוספת לוג ב־`updateCompletion` בלי טוקנים.

**92. מציאת קוד כפול והצעת Refactoring.**
לדוגמה, לוגיקת pagination הייתה חוזרת בשני בקרים — חולצה ל־[`server/lib/pagination.js`](../server/lib/pagination.js). בדיקות הרשאה חולצו ל־[`server/lib/workspaceAuth.js`](../server/lib/workspaceAuth.js).

**93. מה יקרה אם נסיר שורה / הפונקציה תחזיר ריק.**
הסרת השמירה `whereNull('completed_at')` ב־`markCompleted` תאפשר זיכוי כפול במרוץ; אם `listForUser` יחזיר `[]` — ה־UI יציג מצב ריק (אין קריסה) כי הבקר ממפה מערך ריק. ניתן להדגים דרך בדיקה.

**94. הוספת בדיקה אוטומטית לתרחיש כשל.**
כפי שהוספנו ב־[`server/tests/jiraClient.reliability.test.js`](../server/tests/jiraClient.reliability.test.js) (timeout/retry). להוסיף תרחיש כשל חדש: למקן 500 ולוודא retry, או למקן 4xx ולוודא אי־retry.

**95. מעקב Debugger אחר בקשה — מסך עד DB.**
נקודות עצירה: ב־`taskStore` (יציאת בקשה), ב־`verifyToken`/`validateBody` (middleware), ב־`updateCompletion` (בקר), וב־`taskAssignment.markCompleted` (DB). ה־`X-Request-Id` מקשר את הלוגים לאורך המסלול.

**96. עקיבה מלאה של בקשה אחת.**
דוגמה מלאה בשאלה 5 + 95: מהלחיצה ב־`TaskList`, דרך `apiFetch`, ה־middlewares, הבקר, הטרנזקציה, ועד `xp_transactions` ב־Postgres וחזרה עם היתרות המעודכנות.
