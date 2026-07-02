# CLAUDE.md

## 1. Project Identity

寻者机器人 (ExRobot) ecosystem — 7 sub-projects: backend, admin UI, 3 Android apps, hardware debug tool, medical docs hub.

| Project | Path | Stack | Own CLAUDE.md |
|---------|------|-------|:---:|
| Backend | `RSP/exbot-sys` | Spring Boot 3.4 + Java 17 + MyBatis Plus, port 8080 | Y |
| Admin Frontend | `RSP/rsp-vue` | Vue 3 + Vite 5 + Element Plus 2.9 + TS + Pinia + UnoCSS, pnpm | N |
| MedicalDeliveryRobot | `MedicalDeliveryRobot/` | Kotlin + AGP 8.13 + Kotlin 2.3, Min SDK 28, arm64-v8a, Pudu EX300 | Y |
| MedicalDeliveryTablet | `MedicalDeliveryTablet/` | Kotlin + AGP 8.13, landscape, Paho MQTT + Retrofit | Y |
| SmartFoodDelivery | `SmartFoodDelivery/` | Kotlin + Clean Arch, AGP 8.13 + Kotlin 2.3, arm64-v8a | Y |
| HardwareDebugTool | `HardwareDebugTool/` | Kotlin + Java, UART/Chassis/MQTT low-level ref, do NOT refactor | Y |
| MedicalDelivery (docs) | `MedicalDelivery/` | Markdown docs + planning hub + mock simulator (WIP) | Y |

**Middleware**: MySQL `47.110.49.110:3306` (exbot_sys_test) exbot:Bot123!@# | Redis `47.110.49.110:6379` db1 bot123!@# | MQTT `47.110.49.110:1883` admin:wangfei123

**MCP**: MySQL MCP in `.mcp.json`. All SQL ops via MCP tools, never raw connection.

**Key docs**: `RSP/exbot-sys/sql/` (init SQL, naming: `{feature}_init.sql`) | `MedicalDelivery/` (requirements, detailed design, API guide, bug log) | `docs/` (system usage + module design docs)

## 2. AI Role

Claude = full-stack developer for this workspace. Understand → design → code → test → verify. Read sub-project CLAUDE.md before touching that project. Ask when uncertain. Build + verify after every code change.

## 3. Global Mandatory Rules

1. **Analyze before acting**: trace root cause + assess impact before coding. Never skip to fix.
2. **Read sub-project CLAUDE.md first**: before touching any sub-project, read its own CLAUDE.md.
3. **Build after code change**: Backend → `mvn clean install -DskipTests`, Android → `./gradlew assembleDebug`, Frontend → `pnpm ts:check`. After backend build: `powershell -Command "Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force"` to kill all Java processes. User restarts from IDEA.
4. **Permission DB edit → clear Redis**: direct DB changes to `system_role_menu`/`system_user_role`/`system_menu` cause permanent 403 without Redis clear. Keys: `user_role_ids:{userId}`, `menu_role_ids:{menuId}`, `permission_menu_ids:{perm}`.
5. **Never guess**: API params, status codes, business rules uncertain → check docs/MCP/ask.
6. **Same issue ≥2 times → update CLAUDE.md**: recurring problems get documented in root or sub-project CLAUDE.md.

## 4. Architecture & Stack Constraints

| Layer | Must | Must NOT |
|-------|------|----------|
| Backend | 3-layer (Ctrl→Svc→DAL), MyBatis Plus, Redis+Redisson, MQTT+EMQX, Quartz JDBC, Spring AI, REST per existing format | Raw SQL concat, ORM swap, new SDKs, large refactors of stable modules |
| Frontend | Vue 3 + Vite 5 + Element Plus 2.9, `<script setup lang="ts">`, pnpm, UnoCSS | npm/yarn, Options API, Handlebars |
| Android | Kotlin+Java, no DI (by lazy/object), AGP 8.13, Min 28/Target 34, arm64-v8a only, Paho MQTT, usb-serial UART | Hilt/Koin, direct SDK calls, main-thread blocking |
| Hardware | Reuse from HardwareDebugTool (UART/Chassis/MQTT) | Refactor low-level protocols |
| Business | Patterns from SmartFoodDelivery for robot apps | Large refactors of stable delivery logic |
| Deps | Existing utils/Managers first | Duplicate utility classes |

**Build**: Backend `mvn clean install -DskipTests` (mvn at `C:/Users/xiaoh/apache-maven-3.9.9/bin/mvn.cmd`). Robot/Tablet/Food/HW `./gradlew assembleDebug` from their dirs. Frontend `pnpm dev` / `pnpm ts:check` from `RSP/rsp-vue`.

## 5. Coding Standards

**General**: camelCase (Java/TS/Kotlin), UPPER_SNAKE constants. Comments = WHY, not WHAT. No docstring templates. YAGNI: extract after 3rd repeat. Match existing file style.

**SQL**: No `SELECT *`. All non-aggregate SELECT columns in GROUP BY. Always LIMIT (max 1000). LambdaQueryWrapper, no raw SQL.

**Backend**: REST per project format (Controller at `/admin-api` prefix). All exceptions caught+logged — no empty catch. Input validate + anti-injection. State transitions via whitelist only.

**Frontend**: `<script setup lang="ts">`. Required fields → red border + error on blur/submit. Number inputs → type + min/max + block illegal chars.

**Android**: Hardware → existing Managers only. IO → `Dispatchers.IO.limitedParallelism(1)`. Domain coordinators → `by lazy(LazyThreadSafetyMode.SYNCHRONIZED)`. No DI framework, manual wiring. MQTT topic prefix: debug = `ex300-test`, release = `ex300-prod`.

## 6. Business & Functional Constraints

**Hard rules (violation = incident)**:
1. Heartbeat isolation: `v1/devices/real-time-data` = position + battery + online ONLY. Task state → `v1/devices/task-status` separate. Never taskState/taskNo/compartments in heartbeat.
2. State machine: all transitions through `ALLOWED_TRANSITIONS` Map. No direct `setStatus()`.
3. No hardcoding: dept IDs, compartment numbers, status codes, IPs, ports → config/DB.
4. Log desensitization: zero patient/staff PII in logs.
5. Delete double-check: cascade delete → two-round status check against MQTT race.

**Business modes**:

| Project | Mode | Trigger | Flow |
|---------|------|---------|------|
| SmartFoodDelivery | 外卖 (送餐到人) | Server task dispatch | 配餐点 → 用户取餐点, 4-digit PIN unlock |
| SmartFoodDelivery | 售卖 (巡逻售卖) | Server patrol task | 自主巡航, QR scan purchase |
| MedicalDeliveryRobot | 实时呼叫 (real-time call) | Tablet initiates call | 导航取件点 → PIN unlock → 配送目的地 → 取标本 |
| MedicalDeliveryRobot | 定时巡楼 (scheduled patrol) | Cloud timer dispatch | 按预设路线依次收集 → 送达检验科 |

**Task priority (SmartFoodDelivery)**: FOOD > NORMAL > PATROL > STANDBY > Charge

**Known traps**:
- Redis permission cache: direct DB edits to permission tables → permanent 403. Clear Redis or use admin UI.
- Chassis SDK async: `navigateTo()` → `stopCurrentTask()` is async. 300ms delay required. **Do NOT remove** — patrol 2nd+ stops lose arrival callbacks without it.
- `reassignTask()` swaps robotSn only, no status reset. Robot self-advances.
- `syncPassword()` is empty stub. Passwords go in task dispatch.

**Robot对接**:
- 华睿 AMR: MQTT通信, see `RSP/exbot-sys/华睿AMR接口整合计划.md`
- 翼菲 RCS: HTTP RESTful API + MD5签名, see `RSP/exbot-sys/翼菲RCS接口对接计划.md`

**Security**: Tablet tokens UUID+24h expiry+ConcurrentHashMap. Password: task-level → dept config fallback. All creds in .mcp.json/config, never code.

## 7. Deliverable Standards

| Deliverable | Verification |
|-------------|-------------|
| Backend | `cd RSP/exbot-sys && mvn clean install -DskipTests` passes |
| Android (any) | `./gradlew assembleDebug` passes, APK at `app/build/outputs/apk/debug/app-debug.apk` |
| Frontend | `cd RSP/rsp-vue && pnpm ts:check` passes |
| Bug fix | Update `MedicalDelivery/手动测试bug记录.md`: symptoms/repro/root cause/fix/time |
| New module | Update sub-project CLAUDE.md code index |
| API change | Update `MedicalDelivery/医疗标本配送模块使用指南.md` |
| TODO/FIXME | `// TODO: description - reason` |

## 8. Interaction Protocol

**Format**: conclusion first → evidence. Options → list + pros/cons + recommendation, wait confirm. Errors → full msg + context + steps tried.

**Forbidden**: guessing params/status/rules → check docs/MCP/ask. Skipping analysis on bugs. Assuming requirements. Ignoring bug history. Unauthorized large refactors of stable low-level code. Random third-party deps/SDKs/plugins.

## 9. Fallback Rules

**Priority**: (1) Section 3 Global Rules > all. (2) Sub-project CLAUDE.md > this file (this = index, sub-project = authority). (3) User verbal instruction > written rules — flag risks then follow.

**Exceptions**: Uncertain decision → list options + impact → wait approval. Architectural risk → pause → report immediately. Same error ≥2 → suggest updating CLAUDE.md. Cross-project impact → flag proactively.

## 10. Product Delivery Rules

- 需求未通过 Development Ready，不允许进入编码。
- 每个 Feature 必须沉淀在 `docs/features/<feature-id>/`。
- 需求必须区分：事实、假设、待确认项、非目标。
- 开发交付物至少包含：需求规格、原型说明、验收用例、架构决策、风险清单。
- 涉及权限、状态机、金额、发布、删除、回滚的功能，必须定义异常流程和回退策略。
- 无法写出可执行验收用例的需求，不得进入开发循环。

**Session resume**: read task context + relevant sub-project CLAUDE.md. Unfinished tasks → confirm state before continuing.
