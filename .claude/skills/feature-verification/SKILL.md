---
name: feature-verification
description: 对指定功能执行需求可追溯验证、后端接口验证、前端交互验证、浏览器端到端测试、截图证据收集和发布质量门禁判定。适用于功能开发完成后的联调、回归和发布前验收。
argument-hint: '<feature-id> [scope]'
arguments:
  - feature_id
  - scope
disable-model-invocation: true
---

# Feature Verification：功能验证与发布门禁

当前功能：$feature_id
验证范围：$scope

## 目标

对 `$feature_id` 生成可追溯、可复现、可审查的验证结论。

链路：验收用例 → 测试执行 → 证据（截图/日志/Trace） → 缺陷与风险 → 发布质量结论。

## 严格边界

可以：阅读规格/验收用例/接口契约/代码；创建或更新测试代码；启动本地测试环境；运行测试；执行浏览器 E2E；生成报告/截图/Trace/缺陷记录；更新验证文档。

不可以：修改业务代码以"修复"测试失败；删除/跳过/弱化失败测试；未经确认更新视觉基线；自动提交/推送/发布/部署；将未执行测试写成已通过；将"无报错"当作"功能验收通过"。

发现产品代码缺陷时：记录复现条件/失败现象/日志/影响范围 → 在 `defects.md` 创建缺陷记录 → 标记 Blocked 或 Ready with Risks → 回流到对应 Skill。

## 第一步：读取规格包与现有测试

1. `.claude/CLAUDE.md`
2. `docs/features/$feature_id/brief.md`
3. `docs/features/$feature_id/spec.md`
4. `docs/features/$feature_id/prototype.md`
5. `docs/features/$feature_id/acceptance-tests.md`
6. `docs/features/$feature_id/architecture-impact.md`
7. `docs/features/$feature_id/handoff.md`
8. 当前功能相关的后端、前端、接口与测试代码
9. 项目已有测试配置、CI 配置、Playwright 配置

不要猜测测试命令。从 `.claude/CLAUDE.md`、`package.json`、`pom.xml`/Gradle/Makefile、CI 配置和已有测试脚本确认。

## 第二步：生成验收可追溯矩阵

创建或更新 `docs/features/$feature_id/test-traceability.md`，使用 `templates/test-traceability.md`。
每条验收用例映射到至少一种验证方式。验证层分类和覆盖规则见模板文件。

关键规则：高风险业务规则必须有 Backend Unit/Integration 覆盖；主用户路径必须有 E2E 覆盖；仅用截图不能证明业务逻辑正确；关键用例无覆盖 = Coverage Gap ≠ Ready。

## 第三步：执行分层验证

按项目实际技术栈执行分层验证。完整验证范围定义见 `references/verification-layers.md`。

关键路径必须覆盖：主流程、一条权限或状态拒绝流程、一条异常或失败恢复流程、一条高风险操作确认流程。
视觉验证默认只做截图证据，不开启全量像素级回归；禁止自动更新基线。

## 第四步：失败分类与回流

每个失败项必须归类。完整分类规则见 `references/defect-classification.md`。
不得写"有问题待优化"——必须写明复现方式、当前/期望结果、影响范围、严重级别、回流阶段、证据路径。

## 第五步：生成验证结论

创建或更新 `docs/features/$feature_id/verification-report.md`，使用 `templates/verification-report.md`。
报告必须包含全部 6 个章节：验证范围、测试结果摘要、验收覆盖情况、关键证据、缺陷与风险、发布质量结论。

## 发布门禁

见 `checklist/release-gate.md`。只有全部检查项通过才能标记 Ready。

## 最终回复格式

完成后只输出：

## $feature_id：验证结论

### 结论
Ready / Ready with Risks / Blocked

### 测试摘要
- 后端：
- 前端：
- 接口：
- E2E：
- 视觉：

### 未通过或未执行项
- 无 / 编号、原因、影响

### 已保存证据
- 路径列表

### 建议回流动作
- 无 / 回流到哪个 Feature Skill、处理什么问题
