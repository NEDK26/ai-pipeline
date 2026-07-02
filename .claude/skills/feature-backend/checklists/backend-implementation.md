# 后端实现检查清单

- [ ] 三层架构：Controller → Service → Mapper，无跨层调用
- [ ] Controller 路径 `/admin-api/` 前缀
- [ ] 参数校验：`@Valid` / `@NotBlank` / `@NotNull` 等
- [ ] 权限：接口有角色/权限注解
- [ ] 返回格式：统一 Result<T> 封装
- [ ] 状态机：所有转换通过 ALLOWED_TRANSITIONS Map
- [ ] 事务：写操作有 @Transactional
- [ ] 异常：所有 catch 有日志，无空 catch
- [ ] 日志脱敏：无患者/员工 PII
- [ ] 删除操作：两轮状态检查防 MQTT 竞态
- [ ] 心跳隔离：不包含 taskState/taskNo/compartments
- [ ] 无硬编码：部门 ID、端口、IP 等在配置/DB
- [ ] SQL 迁移文件：`sql/{feature}_init.sql`
