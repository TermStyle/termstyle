# Contributing to @oxog/termstyle

We love your input! We want to make contributing to @oxog/termstyle as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 14+ 
- npm 7+ (or yarn/pnpm equivalent)
- Git

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/your-username/termstyle-core.git
cd termstyle-core

# Install dependencies
npm install

# Run tests to ensure everything works
npm test

# Start development
npm run dev
```

### Development Scripts

```bash
# Build the project
npm run build

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Full CI check
npm run test:ci
```

## Code Style

We use ESLint and Prettier to maintain consistent code style:

- **ESLint**: Configured with TypeScript and security rules
- **Prettier**: For code formatting
- **TypeScript**: Strict mode enabled

### Code Style Guidelines

1. **Use TypeScript**: All new code should be written in TypeScript
2. **Follow ESLint rules**: Run `npm run lint` before committing
3. **Write tests**: Maintain 100% code coverage
4. **Document APIs**: Use JSDoc for public APIs
5. **Use meaningful names**: Variables, functions, and classes should be descriptive

### Example Code Style

```typescript
/**
 * Apply a gradient effect to text
 * @param colors - Array of colors for the gradient
 * @param text - Text to apply gradient to
 * @returns Styled text with gradient
 */
export function gradient(colors: string[], text: string): string {
  // Implementation
}
```

## Testing

We maintain 100% test coverage. All code must be tested.

### Testing Guidelines

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test feature combinations
3. **Performance Tests**: Ensure performance requirements
4. **Browser Tests**: Test cross-platform compatibility

### Writing Tests

```typescript
describe('gradient function', () => {
  it('should apply gradient to text', () => {
    const result = gradient(['red', 'blue'], 'Hello');
    expect(result).toHaveANSICode('31'); // Red
    expect(result).toContain('Hello');
  });

  it('should handle empty colors array', () => {
    expect(() => gradient([], 'Hello')).toThrow();
  });
});
```

### Custom Test Matchers

We provide custom Jest matchers:

- `toHaveANSICode(code)`: Check for specific ANSI codes
- `toCompleteWithin(ms)`: Performance testing
- `toBeValidColor()`: Color validation

## Performance Requirements

@oxog/termstyle is performance-focused. Contributions should maintain:

- **Fast execution**: Operations should complete in microseconds
- **Memory efficiency**: Avoid memory leaks and excessive allocation
- **Caching**: Use intelligent caching where appropriate
- **Bundle size**: Keep the library lightweight

## Documentation

### API Documentation

Document all public APIs using JSDoc:

```typescript
/**
 * Create a styled text with specified color
 * @param color - Color name, hex, or RGB values
 * @param text - Text to style
 * @returns Styled text
 * @example
 * ```typescript
 * const red = createStyle('red', 'Hello World');
 * console.log(red);
 * ```
 */
```

### README Updates

If you change functionality, update:

- README.md examples
- API reference tables
- Feature lists
- Compatibility information

## Pull Request Process

1. **Create a feature branch**: `git checkout -b feature/amazing-feature`
2. **Make your changes**: Follow code style and write tests
3. **Test thoroughly**: Run the full test suite
4. **Update documentation**: Update relevant docs
5. **Commit with clear messages**: Use conventional commits
6. **Push and create PR**: Describe your changes clearly

### Conventional Commits

We use conventional commits for clear history:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `perf:` Performance improvements

Example:
```
feat: add gradient color support

- Implement gradient effect for text
- Add gradient() method to main API
- Update documentation with examples
- Add comprehensive tests

Closes #123
```

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- **Environment**: OS, Node.js version, terminal
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Reproduction steps**: Minimal example to reproduce
- **Screenshots**: If applicable

### Feature Requests

Use the feature request template and include:

- **Problem description**: What problem does this solve
- **Proposed solution**: Your suggested approach
- **Alternatives considered**: Other solutions you've thought about
- **Additional context**: Any other relevant information

## Security

### Reporting Security Issues

Please report security vulnerabilities to [security@termstyle.com](mailto:security@termstyle.com) rather than creating public issues.

### Security Guidelines

- Never commit secrets or sensitive data
- Validate all user inputs
- Use secure coding practices
- Follow security scanning results

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a welcoming environment

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code reviews and contributions
- **Email**: Security issues and private matters

## Recognition

Contributors will be:

- Listed in the README acknowledgments
- Mentioned in release notes for significant contributions
- Invited to join the maintainer team for outstanding contributions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask! Create an issue or reach out to the maintainers:

- Open a [GitHub Discussion](https://github.com/termstyle/termstyle/discussions)
- Email us at [contributors@termstyle.com](mailto:contributors@termstyle.com)
- Check our [FAQ](https://github.com/termstyle/termstyle/wiki/FAQ)

Thank you for contributing to @oxog/termstyle! 🎨