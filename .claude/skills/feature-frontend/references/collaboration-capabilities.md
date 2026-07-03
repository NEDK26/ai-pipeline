# 可选协作能力

若当前环境已安装以下 Skill，可按需要手动叠加调用：

- `interface-design`：页面设计审查与视觉把关
- `webapp-testing`：浏览器流程、截图、Console、网络验证

## 组合调用

```
/feature-frontend /interface-design F-021 "Slice 1"
```

或先执行 `/feature-frontend` 后，在同一会话明确说：

> 使用 interface-design，
> 审查当前页面实现的设计质量和交互一致性。
