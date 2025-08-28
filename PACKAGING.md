# VSCode Extension Packaging & Marketplace Deployment Guide

This guide provides step-by-step instructions for packaging and publishing the VSCode JIRA Integration extension to the Visual Studio Code Marketplace.

## 📦 Prerequisites

### Required Tools
1. **Node.js**: Version 16.x or higher
2. **npm**: Latest version
3. **vsce**: VSCode Extension Manager
4. **Git**: For version control
5. **VSCode**: For testing

### Install vsce (VSCode Extension Manager)
```bash
npm install -g vsce
```

### Azure DevOps Account
1. Create account at [Azure DevOps](https://dev.azure.com/)
2. Generate Personal Access Token (PAT)
3. Set up publisher account

## 🚀 Pre-Packaging Checklist

### Code Quality
- [ ] All tests pass: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Code compiles successfully: `npm run compile`
- [ ] Extension builds without errors: `npm run package`

### Documentation
- [ ] README.md is comprehensive and up-to-date
- [ ] CHANGELOG.md includes all changes
- [ ] All commands are documented
- [ ] Screenshots/GIFs are current (if applicable)

### Package.json Validation
- [ ] Version number is correct
- [ ] Display name is appropriate
- [ ] Description is clear and concise
- [ ] Categories are correct
- [ ] Keywords are relevant
- [ ] Repository URL is correct
- [ ] License is specified
- [ ] Publisher is set

### Security Review
- [ ] No hardcoded secrets or tokens
- [ ] Dependencies are up-to-date
- [ ] No known vulnerabilities: `npm audit`
- [ ] Proper error handling for sensitive operations

## 📋 Package.json Configuration

### Essential Fields
```json
{
  "name": "vscode-jira-integration",
  "displayName": "VSCode JIRA Integration",
  "description": "Comprehensive Jira Cloud integration for VSCode",
  "version": "0.0.1",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": [
    "Other",
    "Extension Packs"
  ],
  "keywords": [
    "jira",
    "atlassian",
    "issue",
    "project management",
    "agile",
    "scrum",
    "kanban"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/vscode-jira-integration.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/vscode-jira-integration/issues"
  },
  "homepage": "https://github.com/your-username/vscode-jira-integration#readme",
  "license": "MIT",
  "icon": "images/icon.png",
  "galleryBanner": {
    "color": "#0052CC",
    "theme": "dark"
  }
}
```

### Update Version Number
```bash
# Patch version (0.0.1 -> 0.0.2)
npm version patch

# Minor version (0.0.1 -> 0.1.0)
npm version minor

# Major version (0.0.1 -> 1.0.0)
npm version major
```

## 🎨 Assets Preparation

### Extension Icon
- **Size**: 128x128 pixels
- **Format**: PNG
- **Location**: `images/icon.png`
- **Design**: Should represent Jira/VSCode integration

### Screenshots (Optional)
- **Size**: 1200x800 pixels recommended
- **Format**: PNG or JPG
- **Location**: `images/` folder
- **Content**: Show key features in action

### Create Icon (if needed)
```bash
# Create images directory
mkdir -p images

# Add your icon file
# images/icon.png (128x128)
```

## 🔧 Build Process

### 1. Clean Build
```bash
# Clean previous builds
rm -rf out/ dist/ *.vsix

# Install dependencies
npm install

# Run full build
npm run compile
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run linting
npm run lint

# Check for vulnerabilities
npm audit
```

### 3. Production Build
```bash
# Create optimized production build
npm run package
```

## 📦 Packaging Commands

### Basic Packaging
```bash
# Package extension
vsce package

# This creates: vscode-jira-integration-0.0.1.vsix
```

### Advanced Packaging Options
```bash
# Package with specific version
vsce package --version 1.0.0

# Package and skip dependency checks
vsce package --no-dependencies

# Package with pre-release flag
vsce package --pre-release

# Package with specific target
vsce package --target win32-x64
```

### Validate Package
```bash
# List package contents
vsce ls

# Show package info
vsce show
```

## 🧪 Local Testing

### Install Locally
```bash
# Install the packaged extension
code --install-extension vscode-jira-integration-0.0.1.vsix

# Test in clean VSCode instance
code --disable-extensions --install-extension vscode-jira-integration-0.0.1.vsix
```

### Test Installation
1. Open VSCode
2. Go to Extensions panel
3. Verify extension appears in installed list
4. Test all functionality
5. Check for any errors in Developer Console

### Uninstall After Testing
```bash
# Uninstall extension
code --uninstall-extension your-publisher.vscode-jira-integration
```

## 🌐 Marketplace Publishing

### 1. Setup Publisher

#### Create Publisher Account
1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
2. Sign in with Microsoft account
3. Create new publisher
4. Note your publisher ID

#### Generate Personal Access Token
1. Go to [Azure DevOps](https://dev.azure.com/)
2. User Settings → Personal Access Tokens
3. Create new token with:
   - **Name**: VSCode Extension Publishing
   - **Scopes**: Marketplace (Manage)
   - **Expiration**: 1 year
4. Copy the token (you won't see it again!)

### 2. Login to vsce
```bash
# Login with your publisher and PAT
vsce login your-publisher-name
# Enter your Personal Access Token when prompted
```

### 3. Publish Extension

#### First Time Publishing
```bash
# Publish to marketplace
vsce publish

# Or publish with specific version
vsce publish 1.0.0

# Publish as pre-release
vsce publish --pre-release
```

#### Update Existing Extension
```bash
# Patch version and publish
vsce publish patch

# Minor version and publish
vsce publish minor

# Major version and publish
vsce publish major
```

### 4. Verify Publication
1. Check [VSCode Marketplace](https://marketplace.visualstudio.com/)
2. Search for your extension
3. Verify all information is correct
4. Test installation from marketplace

## 🔄 Automated Publishing

### GitHub Actions Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish Extension

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Build extension
        run: npm run compile
        
      - name: Publish to VSCode Marketplace
        uses: HaaLeo/publish-vscode-extension@v1
        with:
          pat: ${{ secrets.VSCE_PAT }}
          registryUrl: https://marketplace.visualstudio.com
```

### Setup Secrets
1. Go to GitHub repository settings
2. Secrets and variables → Actions
3. Add new secret:
   - **Name**: `VSCE_PAT`
   - **Value**: Your Personal Access Token

## 📊 Post-Publishing Checklist

### Immediate Verification
- [ ] Extension appears in marketplace
- [ ] All metadata is correct
- [ ] Screenshots/icon display properly
- [ ] Installation works from marketplace
- [ ] All features work after marketplace install

### Monitoring
- [ ] Check download statistics
- [ ] Monitor user reviews and ratings
- [ ] Watch for bug reports
- [ ] Track performance metrics

### Documentation Updates
- [ ] Update README with marketplace link
- [ ] Add installation badge
- [ ] Update version references
- [ ] Announce release (if applicable)

## 🐛 Troubleshooting

### Common Packaging Issues

#### "Publisher not found"
```bash
# Solution: Create publisher first
vsce create-publisher your-publisher-name
```

#### "Invalid version"
```bash
# Solution: Use semantic versioning
# Valid: 1.0.0, 1.2.3, 0.1.0-beta
# Invalid: 1.0, v1.0.0, 1.0.0.0
```

#### "Missing files"
```bash
# Solution: Check .vscodeignore
# Make sure required files aren't excluded
```

#### "Authentication failed"
```bash
# Solution: Re-login with fresh token
vsce logout
vsce login your-publisher-name
```

### Package Size Issues

#### Reduce Package Size
```bash
# Check what's included
vsce ls

# Add to .vscodeignore:
src/
.vscode/
node_modules/
*.map
*.ts
.git/
.gitignore
.eslintrc.json
tsconfig.json
webpack.config.js
```

#### Optimize Bundle
```bash
# Use webpack production mode
npm run package

# Check bundle size
ls -la dist/
```

## 📈 Marketplace Optimization

### SEO Best Practices
- **Title**: Include relevant keywords
- **Description**: Clear, benefit-focused
- **Tags**: Use all relevant categories
- **README**: Comprehensive with examples

### Visual Appeal
- **Icon**: Professional, recognizable
- **Screenshots**: Show key features
- **GIFs**: Demonstrate workflows
- **Banner**: Consistent branding

### User Experience
- **Clear installation instructions**
- **Quick start guide**
- **Troubleshooting section**
- **Contact information**

## 🔄 Update Process

### Regular Updates
1. **Fix bugs** reported by users
2. **Add features** based on feedback
3. **Update dependencies** regularly
4. **Improve documentation** continuously

### Release Schedule
- **Patch releases**: Bug fixes (weekly/bi-weekly)
- **Minor releases**: New features (monthly)
- **Major releases**: Breaking changes (quarterly)

### Version Management
```bash
# Update version in package.json
npm version patch

# Update CHANGELOG.md
# Commit changes
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1
git push origin main --tags

# Publish update
vsce publish
```

## 📋 Release Checklist Template

```markdown
## Release v1.0.1 Checklist

### Pre-Release
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version bumped
- [ ] CHANGELOG updated
- [ ] Security audit clean

### Packaging
- [ ] Clean build completed
- [ ] Package created successfully
- [ ] Local testing completed
- [ ] No errors in package validation

### Publishing
- [ ] Published to marketplace
- [ ] Installation verified
- [ ] All features tested
- [ ] Marketplace listing correct

### Post-Release
- [ ] Release notes published
- [ ] Social media updated
- [ ] Documentation site updated
- [ ] Monitoring setup
```

## 🎯 Success Metrics

### Track These Metrics
- **Downloads**: Total and weekly
- **Ratings**: Average and count
- **Reviews**: Positive/negative feedback
- **Issues**: Bug reports and feature requests
- **Usage**: Active users (if analytics available)

### Improvement Areas
- **User feedback**: Address common complaints
- **Performance**: Optimize based on usage patterns
- **Features**: Add most requested functionality
- **Documentation**: Improve based on support questions

---

## 🚀 Quick Reference Commands

```bash
# Complete packaging workflow
npm install
npm test
npm run lint
npm run compile
vsce package
vsce publish

# Emergency unpublish (use carefully!)
vsce unpublish your-publisher.extension-name@version
```

**Ready to ship! 🎉**

For questions about packaging or publishing, refer to the [official VSCode extension documentation](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).