# Versioning Guide

This project follows [Semantic Versioning 2.0.0](https://semver.org/).

## Version Format: MAJOR.MINOR.PATCH

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

## Current Version: 1.0.0

## How to Version

### 1. Update Version Files
Update the version in these files:
- `VERSION` (root)
- `frontend/package.json`
- `backend/composer.json`

### 2. Update CHANGELOG.md
Document all changes under the new version following the format:
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security fixes
```

### 3. Commit and Tag
```bash
git add .
git commit -m "chore: bump version to X.Y.Z"
git tag -a vX.Y.Z -m "Release version X.Y.Z"
git push origin main --tags
```

## Version History

- **1.0.0** (2026-02-14) - Initial release

## Pre-release Versions

For pre-release versions, use:
- Alpha: `1.0.0-alpha.1`
- Beta: `1.0.0-beta.1`
- Release Candidate: `1.0.0-rc.1`

## Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `hotfix/*` - Urgent fixes for production
- `release/*` - Release preparation branches
