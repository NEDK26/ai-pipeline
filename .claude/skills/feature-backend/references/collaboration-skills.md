# 可选协作能力

若当前环境已安装以下 Skill，可按需要手动叠加调用：

- `superpowers:test-driven-development`：关键业务规则的 TDD 流程
- `superpowers:verification-before-completion`：完成后自检
- `ponytail`：代码精简审查
- `andrej-karpathy-skills-1.0.0`：避免过度工程化

## 组合调用

```
/feature-backend /superpowers:test-driven-development F-021 "Slice 1"
```

或先执行 `/feature-backend` 后，在同一会话明确说：

> 使用 superpowers:test-driven-development，
> 为当前 Slice 的关键业务规则补充失败测试并实现最小代码。
