# Android Release Keystore & GitHub Actions Signing Guide

This guide explains how to generate a release signing keystore for MehrChain Android APK and configure it in GitHub Actions.

---

## 1. Generate a Release Keystore

Run the following command in your terminal (using JDK `keytool`):

```bash
keytool -genkey -v -keystore release.keystore -alias mehrchain -keyalg RSA -keysize 2048 -validity 10000
```

You will be prompted to enter:
- Keystore password (e.g. `YourSecurePassword123`)
- Your name / organization details
- Key password (can be the same as keystore password)

> ⚠️ **Important**: Keep `release.keystore` and passwords in a secure location (e.g. password manager). Do **NOT** commit `release.keystore` to Git.

---

## 2. Convert Keystore to Base64

To add the keystore as a GitHub secret:

### On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) | Set-Clipboard
```

### On macOS / Linux:
```bash
base64 -w 0 release.keystore | pbcopy  # or xclip / wl-copy
```

---

## 3. Add GitHub Repository Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions → Repository secrets** and add the following 4 secrets:

| Secret Name | Value | Description |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | `...base64 string...` | The Base64-encoded content of `release.keystore` |
| `KEYSTORE_PASSWORD` | `YourSecurePassword123` | Password for the keystore |
| `KEY_ALIAS` | `mehrchain` | The alias provided during keystore generation |
| `KEY_PASSWORD` | `YourSecurePassword123` | Password for the key alias |

---

## 4. Triggering a Release Build

### Automated Tag Release:
Push a Git tag matching `v*`:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### Manual Trigger:
Go to **GitHub Actions → Build & Release Android APK → Run workflow**:
- Check **Publish official GitHub Release**
- Specify version tag (e.g. `v0.9.5-preview`)
