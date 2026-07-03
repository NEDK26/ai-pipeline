---
name: project-bootstrap
description: 以只读方式识别项目结构、技术栈、可执行命令与稳定约束，并基于模板生成或更新 docs/project-reference.md。
argument-hint: ''
disable-model-invocation: true
---

# Project Bootstrap：项目初始化

## 目标

基于 `docs/project-reference-template.md` 生成或更新：

```text
docs/project-reference.md
```

该文件用于向后续 Skill 提供可靠、可追溯的项目事实，包括：

- 项目结构与子项目边界；
- 技术栈与关键依赖；
- 已发现的构建、测试、运行命令；
- 可执行的代码规范与质量门禁；
- 跨功能、长期稳定的业务与架构约束；
- 当前缺失信息、冲突信息与人工确认项。

本 Skill 是事实采集器，不是业务代码生成器；不得自行补造项目能力、命令或业务规则。

## 严格边界

### 可以

- 读取目录结构、非敏感项目配置、CI 配置、构建脚本、代码风格配置和已有项目文档；
- 读取 `pom.xml`、`build.gradle*`、`package.json`、`Makefile`、Docker 配置、CI workflow；
- 读取现有 `CLAUDE.md`、`.claude/rules/`、子项目 `CLAUDE.md`，用于识别编码与协作规范；
- 基于模板创建或更新 `docs/project-reference.md`；
- 标记 `Confirmed`、`Inferred`、`TODO: human confirmation`、`Conflict`；
- 在输出中列出发现来源和无法确认的项目事实。

### 不可以

- 安装依赖；
- 执行构建、测试、启动、数据库迁移、格式化、代码生成或部署命令；
- 修改业务代码、测试代码、依赖文件、配置文件、数据库迁移、CI 配置；
- 提交、推送、重置或清理 Git 工作区；
- 读取 `.env`、`.env.*`、私钥、证书、Token、密码文件的内容；
- 读取或记录数据库 URL、用户名、密码、连接串、私有 IP、端口、MQTT Broker、云密钥、认证信息；
- 因目录名、依赖名或常见惯例而虚构构建命令、测试命令或业务规则。

## 信息可信度规则

每一项重要信息必须标记可信度：

| 标记 | 含义 |
|---|---|
| `Confirmed` | 已由可执行配置、实际脚本、CI、代码或明确文档直接验证 |
| `Inferred` | 根据依赖、目录结构、命名或非决定性证据推断，仍需确认 |
| `TODO: human confirmation` | 当前无法自动确认，必须由人工补充 |
| `Conflict` | 多个来源存在冲突，禁止自行裁决 |

信息来源优先级：

```text
实际代码与可执行配置
> CI workflow 与构建脚本
> 子项目 CLAUDE.md 与 path-scoped rules
> 项目文档与 README
> 目录命名与依赖推断
```

当高优先级与低优先级来源冲突时，采用高优先级来源，并记录冲突。

## 执行步骤

### 第一步：读取模板与已有项目参考

1. 读取：

```text
docs/project-reference-template.md
```

2. 若存在，读取：

```text
docs/project-reference.md
```

3. 识别以下区域：

```text
自动采集信息
人工确认与项目决策
待确认与冲突
```

4. 不得覆盖“人工确认与项目决策”区域。

### 第二步：扫描项目结构与项目入口

以只读方式扫描。

#### 顶层结构

执行：

```bash
ls -la
```

识别：

- 后端、前端、移动端、共享模块、基础设施、文档、测试、脚本目录；
- 多模块构建结构；
- Docker、CI、部署、数据库迁移目录；
- 子项目边界与相对路径。

#### 构建与技术栈

搜索并读取以下非敏感文件：

| 文件类型 | 允许提取的信息 |
|---|---|
| `pom.xml` | groupId、artifactId、Java 版本、依赖类型、Spring Boot plugin / dependency、构建插件 |
| `build.gradle`、`build.gradle.kts` | Gradle、Android Gradle Plugin、Kotlin、minSdk、targetSdk、模块关系 |
| `package.json` | scripts、框架依赖、构建工具、测试工具、lint / format 工具 |
| 锁文件 | 包管理器类型与锁定工具 |
| `Makefile` | 可执行目标及其命令 |
| `Dockerfile`、`docker-compose.yml` | 镜像构建阶段、服务类型、容器编排结构；不记录环境变量值 |
| `.github/workflows/**`、`.gitlab-ci.yml` | CI 中实际使用的构建、检查、测试、制品命令 |
| `.editorconfig`、ESLint、Prettier、Checkstyle、Spotless 等 | 格式化、静态检查、代码规范能力 |

技术栈判断规则：

```text
pom.xml 存在 → Confirmed：Maven 项目
存在 spring-boot-starter 或 spring-boot-maven-plugin → Confirmed：使用 Spring Boot
package.json 存在 → Confirmed：Node.js 项目
dependencies/devDependencies 中存在 vue 或 react → Confirmed：使用对应前端框架
目录名为 frontend、server、backend → 仅可标记为 Inferred，不能单独作为技术栈结论
```

#### 中间件与环境配置

允许识别文件是否存在及配置结构，但禁止读取敏感值。

| 文件类型 | 允许记录 | 禁止记录 |
|---|---|---|
| `application*.yml`、`application*.properties` | Profile 名称、配置键类别、MySQL / Redis / MQTT / MQ 等技术类型 | URL、IP、端口、用户名、密码、Token、连接串 |
| `.env`、`.env.*` | 文件是否存在 | 文件内容、变量名、变量值 |
| `.mcp.json` | MCP 配置是否存在、服务标识 | 认证信息、URL、Token、私有地址 |

### 第三步：逐节填充

按 `docs/project-reference-template.md` 的结构填充。

| 模板节 | 主要数据来源 | 填充要求 |
|---|---|---|
| 项目结构 | 目录扫描、模块配置、Docker、CI | 记录真实路径与职责；目录名称不能作为唯一证据 |
| 架构与技术栈约束 | Maven / Gradle / package 配置、启动类、核心模块代码 | 记录语言、框架、ORM、数据库、中间件、鉴权、构建工具；依赖存在不等于功能已启用 |
| 构建、测试与运行命令 | package scripts、Maven/Gradle、Makefile、Docker、CI | 优先记录 CI 实际执行命令；未实际执行过的命令标记 `Unverified` |
| 编码规范与质量门禁 | 子项目 CLAUDE、rules、格式化与静态检查配置、测试配置 | 记录可执行、可检查的规范；不复制泛化工作流规则 |
| 项目业务与功能约束 | ADR、需求文档、接口文档、数据库 schema、权限模型、稳定业务代码 | 仅记录跨功能、长期稳定的约束；不把 Git、审查、发布流程写入本节 |
| 交付物与验证标准 | CI、测试目录、部署脚本、已有发布文档 | 记录真实存在的构建、lint、单测、集成测试、E2E、镜像、部署验证步骤；未发现则写 `Not configured` |

### 第四步：生成或更新项目参考

#### 文件不存在

创建：

```text
docs/project-reference.md
```

仅基于模板与已验证信息填充。

#### 文件已存在

1. 保留“人工确认与项目决策”区域，不得修改；
2. 仅更新“自动采集信息”区域；
3. 发现新增模块、依赖或 CI 命令时补充；
4. 信息发生冲突时，不覆盖人工结论；
5. 将冲突写入“待确认与冲突”章节。

不得使用 HTML 注释隐藏关键冲突。必须以表格或明确文本记录。

### 第五步：输出摘要

输出以下格式：

```markdown
## 项目初始化完成

### 已确认项目事实
- [Confirmed] <事实>（来源：<文件路径>）
- [Confirmed] <事实>（来源：<文件路径>）

### 推断但待确认的信息
- [Inferred] <事实>（依据：<文件路径>）

### 发现的子项目
- `<路径>`：<技术栈与职责>

### 已发现的构建与验证命令
- `<命令>`：<用途>（来源：<文件路径>，状态：Confirmed / Unverified）

### 需要人工确认
- <字段或事实>：<原因>

### 冲突
- <冲突内容>：<来源 A> 与 <来源 B>

### 修改范围
- 仅创建或更新：`docs/project-reference.md`
- 未修改业务代码、依赖、配置、CI、数据库迁移或 Git 状态
```
