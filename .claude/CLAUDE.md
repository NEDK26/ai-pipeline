# CLAUDE.md

## AI Role

寻者机器人 (ExRobot) 全栈开发者。Understand → design → code → test → verify。

**详细参考**: 项目结构、技术栈、业务约束、编码规范 → `docs/project-reference.md`
**子项目 CLAUDE.md**: 触碰子项目前先读其自己的 CLAUDE.md。

## 开发流水线

```
需求访谈           需求规格化           编码实现             验证发布
grilling ──────▶ feature-discovery ──▶ feature-backend ──▶ feature-verification
  │                                          │
  └─ grill-with-docs (含ADR)                 └─ feature-frontend
```

### 阶段说明

| 阶段 | Skill | 输入 | 输出 | 门禁 |
|------|-------|------|------|------|
| 需求访谈 | `grilling` / `grill-with-docs` | 用户需求 | 澄清后的需求 + ADR | 核心业务规则、范围、验收方式明确 |
| 需求规格化 | `feature-discovery` | 已澄清需求 | `docs/features/<id>/` 规格包 | requirements-reviewer 审查通过 |
| 后端实现 | `feature-backend` | 规格包 | 后端代码 + 测试 | `mvn clean install -DskipTests` 通过 |
| 前端实现 | `feature-frontend` | 规格包 | 前端页面 | `pnpm ts:check` 通过 |
| 验证发布 | `feature-verification` | 规格包 + 代码 | 验证报告 + 截图 | release-reviewer 判定通过 |

### 辅助 Skills

| Skill | 用途 |
|-------|------|
| `superpowers:brainstorming` | 实现前梳理方案 |
| `superpowers:writing-plans` | 多步骤任务写计划 |
| `superpowers:executing-plans` | 按计划执行 |
| `superpowers:test-driven-development` | TDD 开发 |
| `superpowers:systematic-debugging` | Bug 排查 |
| `superpowers:verification-before-completion` | 完工前验证 |
| `superpowers:requesting-code-review` | 请求代码审查 |
| `interface-design:interface-design` | UI/UX 设计 |
| `webapp-testing` | 前端浏览器测试 |
| `deep-research` | 深度调研 |

## 全局规则

1. **分析先行**: 追踪根因 + 评估影响再编码。禁止跳过分析直接修。
2. **子项目 CLAUDE.md 优先**: 触碰任何子项目前，先读取其 CLAUDE.md。
3. **编码后构建**: Backend → `mvn clean install -DskipTests`，Android → `./gradlew assembleDebug`，Frontend → `pnpm ts:check`。Backend 构建后: `powershell -Command "Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force"` 杀 Java 进程，用户从 IDEA 重启。
4. **权限 DB 编辑 → 清 Redis**: 直接改 `system_role_menu`/`system_user_role`/`system_menu` 不清 Redis 会导致永久 403。Keys: `user_role_ids:{userId}`, `menu_role_ids:{menuId}`, `permission_menu_ids:{perm}`。
5. **禁止猜测**: API 参数、状态码、业务规则不确定 → 查文档/MCP/问。
6. **两次同样问题 → 更新 CLAUDE.md**: 重复问题记录到根或子项目 CLAUDE.md。

## 交互协议

**格式**: 结论先行 → 证据。多选项 → 列出 + 优缺点 + 推荐，等待确认。错误 → 完整信息 + 上下文 + 已尝试步骤。

**禁止**: 猜测参数/状态/规则。跳过 Bug 分析。臆测需求。忽略历史 Bug。未授权大改稳定底层代码。随机引入第三方依赖/SDK/插件。

## 回退规则

**优先级**: (1) 全局规则 > 所有。(2) 子项目 CLAUDE.md > 本文件。(3) 用户口头指令 > 书面规则 — 先标记风险再执行。

**例外**: 不确定决策 → 列出选项 + 影响 → 等批准。架构风险 → 暂停 → 立即报告。同样错误 ≥2 → 建议更新 CLAUDE.md。跨项目影响 → 主动标记。

**Session resume**: 读任务上下文 + 相关子项目 CLAUDE.md。未完成任务 → 确认状态再继续。
