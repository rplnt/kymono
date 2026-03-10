#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/release.sh [patch|minor|major]
# Default: patch
#
# Bumps the version tag, updates config.ts with git describe output, and builds.
# Version format: v2.1.0 (on tag) or v2.1.0-3-gabc1234 (commits past tag)

BUMP="${1:-patch}"
CONFIG="src/config.ts"

# Extract current semver from config.ts
CURRENT=$(grep -oP "version: 'v\K[0-9]+\.[0-9]+\.[0-9]+" "$CONFIG")
if [ -z "$CURRENT" ]; then
  echo "Error: could not read version from $CONFIG"
  exit 1
fi

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case "$BUMP" in
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  patch) PATCH=$((PATCH + 1)) ;;
  *) echo "Usage: $0 [patch|minor|major]"; exit 1 ;;
esac

NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"

echo "Bumping version: v${CURRENT} -> ${NEW_TAG}"

# Create git tag
git tag "$NEW_TAG"

# Get version string from git describe (tag or tag+offset+hash)
FULL_VERSION=$(git describe --tags)

echo "Version: ${FULL_VERSION}"

# Update config.ts
sed -i "s/version: 'v[^']*'/version: '${FULL_VERSION}'/" "$CONFIG"

# Build production
echo "Building production..."
npm run build

# Build debug
echo "Building debug..."
npm run build:debug

echo ""
echo "Release ${FULL_VERSION} built successfully."
echo "  Production: dist/"
echo "  Debug:      dist-debug/"
