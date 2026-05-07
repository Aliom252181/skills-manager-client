# 代码签名说明

## 签名是可选的！

**不配置签名完全可以正常使用**。未签名的影响：

| 平台 | 未签名效果 | 解决方式 |
|------|-----------|----------|
| Linux | ✅ 完全正常 | 无需处理 |
| Windows | ⚠️ 提示"未知发布者" | 右键 → 仍要运行 |
| macOS | ⚠️ 提示"无法验证" | 系统偏好设置 → 仍要打开 |

---

## 如果需要配置签名

### Windows 签名（可选）

**免费方式 - 自签名证书：**

```bash
# 1. 安装 OpenSSL（Windows 可用 Git Bash 或 WSL）
# 2. 生成自签名证书
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# 3. 合并为 PFX 格式
openssl pkcs12 -export -out windows-cert.pfx -inkey key.pem -in cert.pem

# 4. 在 GitHub 添加 Secret
# Settings → Secrets → New repository secret
# 名称: TAURI_SIGNING_PRIVATE_KEY
# 值: (打开 windows-cert.pfx 文件，把内容粘贴进去)
```

**注意事项：**
- 自签名证书会有红色警告，适合内部/测试使用
- 正式发布建议购买 EV 证书（Comodo、DigiCert 等，约 $200-400/年）

### macOS 签名（可选）

**需要 Apple 开发者账号（$99/年）：**

1. 登录 [Apple Developer](https://developer.apple.com)
2. 申请 Developer ID
3. 在 Xcode 导出签名证书
4. 添加到 GitHub Secrets

---

## 推荐做法

**开源项目建议：**
- ✅ 不签名 - 减少配置复杂度
- ✅ 用户可以自行验证源码
- ✅ 使用 AppImage (Linux) 避免签名问题

**商业项目建议：**
- Windows: 购买 EV 代码签名证书
- macOS: 注册 Apple Developer Program ($99/年)

---

## 快速开始（不签名）

1. 推送代码到 GitHub
2. 创建 tag：`git tag v1.0.0 && git push origin v1.0.0`
3. GitHub Actions 自动构建
4. 在 Releases 页面下载安装包

不需要任何额外配置！