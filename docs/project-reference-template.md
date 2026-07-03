# 项目参考

> 由 `.claude/CLAUDE.md` 引用。项目结构、技术栈、业务约束、编码规范。
>
> 复制此模板为 `project-reference.md` 并填入实际值。

## 项目结构

寻者机器人 (ExRobot) ecosystem — 7 个子项目：

| Project | Path | Stack | Own CLAUDE.md |
|---------|------|-------|:---:|
| Backend | `<backend-path>` | Spring Boot 3.4 + Java 17 + MyBatis Plus, port 8080 | Y |
| Admin Frontend | `<frontend-path>` | Vue 3 + Vite 5 + Element Plus 2.9 + TS + Pinia + UnoCSS, pnpm | N |
| MedicalDeliveryRobot | `MedicalDeliveryRobot/` | Kotlin + AGP 8.13 + Kotlin 2.3, Min SDK 28, arm64-v8a, Pudu EX300 | Y |
| MedicalDeliveryTablet | `MedicalDeliveryTablet/` | Kotlin + AGP 8.13, landscape, Paho MQTT + Retrofit | Y |
| SmartFoodDelivery | `SmartFoodDelivery/` | Kotlin + Clean Arch, AGP 8.13 + Kotlin 2.3, arm64-v8a | Y |
| HardwareDebugTool | `HardwareDebugTool/` | Kotlin + Java, UART/Chassis/MQTT low-level ref, do NOT refactor | Y |
| MedicalDelivery (docs) | `MedicalDelivery/` | Markdown docs + planning hub + mock simulator (WIP) | Y |

**中间件**: MySQL `<db-host>:3306` (`<db-name>`) `<db-user>:<db-password>` | Redis `<redis-host>:6379` db1 `<redis-password>` | MQTT `<mqtt-host>:1883` `<mqtt-user>:<mqtt-password>`

**MCP**: MySQL MCP in `.mcp.json`. 所有 SQL 操作通过 MCP 工具，禁止裸连接。

**关键文档**: `<backend-path>/sql/` (init SQL, 命名: `{feature}_init.sql`) | `MedicalDelivery/` (需求、详细设计、API指南、bug记录) | `docs/` (系统使用 + 模块设计)

## 架构与技术栈约束

| 层 | 必须 | 禁止 |
|-------|------|----------|
| Backend | 3-layer (Ctrl→Svc→DAL), MyBatis Plus, Redis+Redisson, MQTT+EMQX, Quartz JDBC, Spring AI, REST | 裸SQL拼接, 换ORM, 新SDK, 大改稳定模块 |
| Frontend | Vue 3 + Vite 5 + Element Plus 2.9, `<script setup lang="ts">`, pnpm, UnoCSS | npm/yarn, Options API, Handlebars |
| Android | Kotlin+Java, no DI (by lazy/object), AGP 8.13, Min 28/Target 34, arm64-v8a only, Paho MQTT, usb-serial UART | Hilt/Koin, 直调SDK, 主线程阻塞 |
| Hardware | 复用 HardwareDebugTool (UART/Chassis/MQTT) | 重构底层协议 |
| Business | 参考 SmartFoodDelivery 模式 | 大改稳定配送逻辑 |
| Deps | 优先用已有 utils/Managers | 重复造工具类 |

**构建命令**:
- Backend: `cd <backend-path> && mvn clean install -DskipTests` (mvn: `<path-to-maven>/bin/mvn.cmd`)
- Android: `./gradlew assembleDebug` (从项目目录)
- Frontend: `cd <frontend-path> && pnpm ts:check`

## 编码规范

**通用**: camelCase (Java/TS/Kotlin), UPPER_SNAKE 常量。注释 = WHY 非 WHAT。YAGNI：第三次重复再抽取。匹配已有文件风格。

**SQL**: 禁止 `SELECT *`。非聚合 SELECT 列必须在 GROUP BY 中。始终 LIMIT (max 1000)。LambdaQueryWrapper，禁止裸SQL。

**Backend**: REST 遵循项目格式 (Controller 前缀 `/admin-api`)。所有异常捕获+日志 — 禁止空 catch。输入校验 + 防注入。状态转换只走白名单。

**Frontend**: `<script setup lang="ts">`。必填字段 → 红色边框 + blur/submit 错误提示。数字输入 → type + min/max + 阻止非法字符。

**Android**: 硬件 → 只用已有 Managers。IO → `Dispatchers.IO.limitedParallelism(1)`。Domain coordinators → `by lazy(LazyThreadSafetyMode.SYNCHRONIZED)`。禁止 DI 框架，手动装配。MQTT topic 前缀: debug = `ex300-test`, release = `ex300-prod`。

## 业务与功能约束

**硬规则（违反 = 事故）**:
1. 心跳隔离: `v1/devices/real-time-data` = 仅位置 + 电量 + 在线状态。任务状态 → `v1/devices/task-status` 独立。心跳中禁止 taskState/taskNo/compartments。
2. 状态机: 所有状态转换必须走 `ALLOWED_TRANSITIONS` Map。禁止直接 `setStatus()`。
3. 禁止硬编码: 科室ID、箱格编号、状态码、IP、端口 → 配置/数据库。
4. 日志脱敏: 日志中零患者/员工 PII。
5. 删除双重确认: 级联删除 → 两轮状态检查防止 MQTT 竞态。

**业务模式**:

| 项目 | 模式 | 触发 | 流程 |
|---------|------|---------|------|
| SmartFoodDelivery | 外卖 (送餐到人) | Server task dispatch | 配餐点 → 用户取餐点, 4-digit PIN unlock |
| SmartFoodDelivery | 售卖 (巡逻售卖) | Server patrol task | 自主巡航, QR scan purchase |
| MedicalDeliveryRobot | 实时呼叫 (real-time call) | Tablet initiates call | 导航取件点 → PIN unlock → 配送目的地 → 取标本 |
| MedicalDeliveryRobot | 定时巡楼 (scheduled patrol) | Cloud timer dispatch | 按预设路线依次收集 → 送达检验科 |

**任务优先级 (SmartFoodDelivery)**: FOOD > NORMAL > PATROL > STANDBY > Charge

**已知陷阱**:
- Redis 权限缓存: 直接改权限表 → 永久 403。通过管理界面或清 Redis。
- Chassis SDK 异步: `navigateTo()` → `stopCurrentTask()` 是异步的。必须 300ms 延迟。**禁止移除** — 否则 patrol 第2站起丢失到达回调。
- `reassignTask()` 只交换 robotSn，不重置状态。机器人自行推进。
- `syncPassword()` 是空桩。密码在任务派发时下发。

**Robot对接**:
- 华睿 AMR: MQTT通信, 见 `<backend-path>/华睿AMR接口整合计划.md`
- 翼菲 RCS: HTTP RESTful API + MD5签名, 见 `<backend-path>/翼菲RCS接口对接计划.md`

**安全**: Tablet tokens UUID+24h expiry+ConcurrentHashMap。Password: task-level → dept config fallback。所有凭据在 .mcp.json/config，禁止写死在代码中。

## 交付物标准

| 交付物 | 验证 |
|-------------|-------------|
| Backend | `cd <backend-path> && mvn clean install -DskipTests` 通过 |
| Android (任意) | `./gradlew assembleDebug` 通过, APK: `app/build/outputs/apk/debug/app-debug.apk` |
| Frontend | `cd <frontend-path> && pnpm ts:check` 通过 |
| Bug fix | 更新 `MedicalDelivery/手动测试bug记录.md`: 现象/复现/根因/修复/时间 |
| New module | 更新子项目 CLAUDE.md code index |
| API change | 更新 `MedicalDelivery/医疗标本配送模块使用指南.md` |
| TODO/FIXME | `// TODO: description - reason` |
