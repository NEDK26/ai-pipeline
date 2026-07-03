---
name: project-bootstrap
description: 扫描项目结构和技术栈，基于模板生成 docs/project-reference.md。不安装依赖、不改业务代码。
argument-hint: ''
disable-model-invocation: true
---

# Project Bootstrap：项目初始化

## 目标

基于 `docs/project-reference-template.md` 生成 `docs/project-reference.md`，让后续 Skill（feature-backend、feature-frontend、feature-verification）有可靠的项目参考文件可读。

## 严格边界

可以：
- 读取项目配置文件和目录结构
- 基于模板生成 `docs/project-reference.md`
- 标记无法自动确认的字段为 `<!-- TODO: 需人工确认 -->`

不可以：
- 安装依赖或修改 `package.json`、`pom.xml`、`build.gradle`
- 修改任何业务代码或配置
- 提交或推送

## 执行步骤

### 第一步：读取模板

读取 `docs/project-reference-template.md`，确认所有待填充的节。

### 第二步：扫描项目结构

扫描并记录：

**顶层目录**：
```bash
ls -la
```

**子项目发现**：搜索以下文件确定子项目及其技术栈：
- `**/pom.xml` → Maven / Spring Boot（读取 groupId、artifactId、Java 版本）
- `**/package.json` → Node.js / 前端（读取 scripts、dependencies、Vue/React）
- `**/build.gradle*` → Gradle / Android（读取 AGP、Kotlin 版本、minSdk）
- `**/Dockerfile*` → Docker 构建
- `**/.gitlab-ci.yml` `**/.github/workflows/**` → CI 配置

**中间件与配置**：搜索：
- `**/application*.yml` `**/application*.properties` → 数据库、Redis、MQTT 连接信息
- `.mcp.json` → MCP 配置
- `.env*` → 环境变量

### 第三步：逐节填充

按 `project-reference-template.md` 的结构逐节写入：

| 模板节 | 数据来源 |
|--------|---------|
| 项目结构 | 第二步扫描结果 |
| 架构与技术栈约束 | pom.xml / gradle / package.json |
| 构建命令 | scripts / CI 配置 |
| 编码规范 | 已有 CLAUDE.md / rules / 代码风格配置 |
| 业务与功能约束 | CLAUDE.md 全局规则、已有文档 |
| 交付物标准 | 构建命令 + 现有验证步骤 |

**原则**：
- 从实际文件提取，不从记忆猜测
- 无法确认的字段写入 `<!-- TODO: 需人工确认 — <原因> -->`
- 中间件密码、IP、端口 → 检查是否已在 `.gitignore` 保护范围内

### 第四步：写入

写入 `docs/project-reference.md`。

若文件已存在：
- 保留人工已确认的内容
- 只补充新发现的子项目、依赖或配置变更
- 新旧结论冲突时在文件中标注 `<!-- CONFLICT: ... -->`

### 第五步：输出摘要

```markdown
## 项目初始化完成

### 发现的子项目
- 路径：技术栈

### 已填充的节
- 项目结构 / 技术栈 / 构建命令 / ...

### 需要人工确认
- 字段名：原因
```
