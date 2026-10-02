# ProNote+ Builds

## Build Status (2026-10-02)

### ✅ Available Builds

| Platform | File | Size | Status |
|----------|------|------|--------|
| Linux | `dist/ProNote+-1.0.0.AppImage` | 490 MB | ✅ Built |
| Linux | `dist/pronoplus_1.0.0_amd64.deb` | 399 MB | ✅ Built |

### ⚠️ Cross-Platform Builds (require Wine)

To build Windows (.exe) and macOS (.dmg) on Linux, you need Wine installed:

```bash
# Install Wine
sudo apt-get install wine

# Then build for Windows
npm run build:win

# For macOS (requires more setup)
npm run build:mac
```

### Build Commands

```bash
# Build all platforms (Linux only)
npm run build:all

# Build for specific platform
npm run build:linux  # Linux (.AppImage, .deb)
npm run build:win    # Windows (.exe) - requires Wine
npm run build:mac    # macOS (.dmg) - requires macOS or cross-compile setup
```

### Build Requirements

- Node.js 18+
- Electron 30.5.1
- Linux: AppImage and deb targets work natively
- Windows: Wine required for cross-compilation
- macOS: Best built on macOS machine
