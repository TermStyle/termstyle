#!/bin/bash

# NPM Publish Script for @oxog/termstyle
# This script prepares and publishes the package to npmjs.com

set -e  # Exit on any error

echo "🚀 Starting publish process for @oxog/termstyle..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're logged in to npm
print_status "Checking NPM authentication..."
if ! npm whoami > /dev/null 2>&1; then
    print_error "You are not logged in to NPM. Please run 'npm login' first."
    exit 1
fi

NPM_USER=$(npm whoami)
print_success "Logged in as: $NPM_USER"

# Verify we're on the right branch (optional - remove if not using git)
if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    print_status "Current git branch: $CURRENT_BRANCH"
    
    # Uncommit this if you want to enforce main branch
    # if [ "$CURRENT_BRANCH" != "main" ]; then
    #     print_warning "Not on main branch. Consider switching to main before publishing."
    #     read -p "Continue anyway? (y/N) " -n 1 -r
    #     echo
    #     if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    #         exit 1
    #     fi
    # fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes."
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Ask for version bump type
echo
print_status "Select version bump type:"
echo "1) patch (${CURRENT_VERSION} -> $(npm version patch --no-git-tag-version --dry-run | cut -d'v' -f2))"
echo "2) minor (${CURRENT_VERSION} -> $(npm version minor --no-git-tag-version --dry-run | cut -d'v' -f2))"
echo "3) major (${CURRENT_VERSION} -> $(npm version major --no-git-tag-version --dry-run | cut -d'v' -f2))"
echo "4) Skip version bump"

read -p "Enter choice (1-4): " -n 1 -r
echo

case $REPLY in
    1)
        print_status "Bumping patch version..."
        npm version patch --no-git-tag-version
        ;;
    2)
        print_status "Bumping minor version..."
        npm version minor --no-git-tag-version
        ;;
    3)
        print_status "Bumping major version..."
        npm version major --no-git-tag-version
        ;;
    4)
        print_status "Skipping version bump..."
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
print_success "Version: $NEW_VERSION"

# Clean and build
print_status "Cleaning previous build..."
rm -rf dist/

print_status "Running tests and build..."
npm run test:ci

print_success "Tests passed!"

# Check package contents
print_status "Package will include these files:"
npm pack --dry-run

echo
print_warning "Ready to publish @oxog/termstyle@$NEW_VERSION"
read -p "Continue with publish? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Publish cancelled."
    exit 0
fi

# Publish to NPM
print_status "Publishing to NPM..."
npm publish

print_success "Successfully published @oxog/termstyle@$NEW_VERSION!"

# Optional: Create git tag if in git repo
if [ -d ".git" ]; then
    print_status "Creating git tag..."
    git add package.json
    git commit -m "chore: bump version to $NEW_VERSION" || true
    git tag "v$NEW_VERSION"
    print_success "Created git tag v$NEW_VERSION"
    
    print_status "Don't forget to push your changes and tags:"
    echo "  git push origin main"
    echo "  git push origin v$NEW_VERSION"
fi

echo
print_success "🎉 Publish complete!"
print_status "Package URL: https://www.npmjs.com/package/@oxog/termstyle"
print_status "Install with: npm install @oxog/termstyle"