# $feature_id：开发交接说明

## Feature Metadata

- **Feature ID**: $feature_id
- **Spec Version**: v0.1
- **API Contract Version**: v0.1
- **Status**: Drafted / Pending Review / Blocked
- **Scope Freeze**: Yes / No
- **Requirements Review**: docs/features/$feature_id/reviews/requirements-review.md
- **Accepted Risks**:
- **Last Updated**: YYYY-MM-DD

## 1. 当前结论
- Drafted / Pending Review / Blocked；
- 结论理由；
- 最后更新日期。

## 2. Loop B 输入清单
- brief.md；
- spec.md；
- prototype.md；
- acceptance-tests.md；
- architecture-impact.md；
- 相关 ADR；
- 相关现有代码、接口、数据库或设计文件。

## 3. 开发任务建议
按可独立验证的纵向切片拆分：
- Slice 1：最小可验证主路径；
- Slice 2：权限与状态规则；
- Slice 3：异常与边界；
- Slice 4：审计、可观测性与回滚；
- Slice 5：页面与端到端验收。

## 4. Development Ready 检查
- [ ] 用户问题明确；
- [ ] 目标用户明确；
- [ ] 范围与非目标明确；
- [ ] 用户故事完整；
- [ ] 业务规则可执行；
- [ ] 权限和状态流转明确；
- [ ] 页面与关键路径明确；
- [ ] 验收用例可执行；
- [ ] 架构影响已识别；
- [ ] 技术风险已记录；
- [ ] 没有阻塞开发的未决问题。

## 5. 阻塞项与待确认项
| 编号 | 问题 | 影响 | 责任人 | 建议处理方式 |
|---|---|---|---|---|

## 6. 进入 Loop B 后的验证建议
- 建议优先实现的验收用例；
- 建议自动化的测试；
- 建议进行截图验证的关键页面；
- 发布后需要观察的体验和运行指标。
