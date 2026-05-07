# Tauri Code Signing

## Overview

This document describes how to configure code signing for Tauri applications on different platforms.

## Windows

### Prerequisites
1. A code signing certificate (EV or OV certificate)
2. The certificate must be in PFX format

### Configuration

1. Export your certificate to PFX format:
```bash
openssl pkcs12 -export -out windows-cert.pfx -inkey key.pem -in cert.pem
```

2. Add the certificate as a GitHub Secret:
   - Go to your repository Settings > Secrets
   - Add `TAURI_SIGNING_PRIVATE_KEY` with the contents of your PFX file
   - Add `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` with your PFX password

3. Update `tauri.conf.json`:
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

## macOS

### Prerequisites
1. Apple Developer account
2. Developer ID certificate from Apple
3. For notarization: App Store Connect API key

### Configuration

1. Export your certificate:
```bash
security import "DeveloperID.p12" -k ~/Library/Keychains/login.keychain
```

2. Add as GitHub Secret:
   - `APPLE_CERTIFICATE` - Base64 encoded certificate
   - `APPLE_CERTIFICATE_PASSWORD` - Certificate password
   - `APPLE_SIGNING_IDENTITY` - Certificate name (e.g., "Developer ID Application: Your Name")

3. For notarization, add:
   - `APPLE_API_KEY` - App Store Connect API key
   - `APPLE_API_ISSUER` - App Store Connect API issuer ID

## Linux

Linux packages don't require code signing, but you should consider:
- Using GPG to sign packages
- Publishing your GPG public key

## CI/CD Environment Variables

Set these in your GitHub repository Settings > Secrets:

| Secret Name | Description |
|------------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Private key for signing (PFX format) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the private key |
| `APPLE_CERTIFICATE` | macOS signing certificate (Base64) |
| `APPLE_CERTIFICATE_PASSWORD` | macOS certificate password |
| `APPLE_SIGNING_IDENTITY` | macOS signing identity |
| `APPLE_API_KEY` | App Store Connect API key (for notarization) |
| `APPLE_API_ISSUER` | App Store Connect API issuer ID |

## References

- [Tauri Signing Guide](https://tauri.app/distribute/sign/)
- [Windows Code Signing](https://tauri.app/distribute/sign/windows/)
- [macOS Code Signing](https://tauri.app/distribute/sign/macos/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)