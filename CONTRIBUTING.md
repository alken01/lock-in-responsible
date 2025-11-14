# Contributing to Lock-In Responsible

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Submitting Changes](#submitting-changes)
6. [Bug Reports](#bug-reports)
7. [Feature Requests](#feature-requests)

## Code of Conduct

This project follows a simple code of conduct:

- **Be respectful**: Treat everyone with respect
- **Be constructive**: Provide helpful feedback
- **Be collaborative**: Work together towards solutions
- **Be patient**: Remember everyone was a beginner once

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ or SQLite
- ESP32 development environment (PlatformIO or Arduino IDE)
- Git

### Setup Development Environment

```bash
# Fork the repository on GitHub

# Clone your fork
git clone https://github.com/YOUR_USERNAME/lock-in-responsible.git
cd lock-in-responsible

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/lock-in-responsible.git

# Install backend dependencies
cd backend
npm install

# Setup database
cp .env.example .env
npm run db:push

# Start development server
npm run dev
```

## Development Workflow

### 1. Create a Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write code
- Add tests
- Update documentation
- Test thoroughly

### 3. Commit Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

**Commit message format:**
```
<type>: <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat: add GitHub integration for goal verification

Added OAuth flow and webhook handlers for GitHub.
This allows automatic verification of commit goals.

Closes #123
```

```
fix: resolve WiFi reconnection issue on ESP32

ESP32 now properly reconnects after WiFi dropout.
Added exponential backoff and improved error handling.

Fixes #456
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Coding Standards

### Backend (TypeScript)

**Style:**
- Use ESLint configuration provided
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line structures

**Example:**
```typescript
import { Request, Response } from 'express';

export const createGoal = async (req: Request, res: Response) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title required' });
  }

  // ... implementation
};
```

**Best Practices:**
- Use TypeScript types (avoid `any`)
- Async/await over callbacks
- Proper error handling
- Descriptive variable names
- Comments for complex logic

### Firmware (C++)

**Style:**
- K&R brace style
- 2 spaces indentation
- CamelCase for functions
- UPPER_CASE for constants
- Comments for each function

**Example:**
```cpp
#define MAX_RETRIES 3

void connectToWiFi() {
  // Attempt WiFi connection with retry logic
  int retries = 0;

  while (WiFi.status() != WL_CONNECTED && retries < MAX_RETRIES) {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    delay(5000);
    retries++;
  }
}
```

### Documentation

- Use Markdown for all docs
- Include code examples
- Keep README files up to date
- Add inline comments for complex code
- Document API changes

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm test`)
- [ ] New features have tests
- [ ] Documentation is updated
- [ ] Commit messages are clear
- [ ] No merge conflicts
- [ ] PR description explains changes

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Follows coding standards
```

### Review Process

1. Submit PR
2. Automated checks run (lint, test, build)
3. Maintainer reviews code
4. Address feedback if needed
5. PR merged once approved

## Bug Reports

### Before Reporting

- Check existing issues
- Verify it's reproducible
- Test on latest version
- Gather relevant information

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. Ubuntu 22.04]
- Node version: [e.g. 20.0.0]
- Firmware version: [e.g. 1.0.0]
- Browser: [if applicable]

## Logs
```
Paste relevant logs here
```

## Additional Context
Any other relevant information
```

## Feature Requests

### Before Requesting

- Check if feature already exists
- Search existing feature requests
- Consider if it fits project scope

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this work?

## Alternatives Considered
What other solutions did you consider?

## Additional Context
Any other relevant information
```

## Areas for Contribution

### Backend
- Additional LLM providers
- More goal types
- Third-party integrations (Jira, Notion, etc.)
- Performance optimizations
- Security enhancements

### Firmware
- BLE communication
- Additional sensors
- Power optimization
- OTA updates
- Web configuration portal

### Frontend (Future)
- React web app
- Mobile app (React Native)
- Dashboard and analytics
- Goal templates

### Documentation
- Tutorials and guides
- API examples
- Video walkthroughs
- Translations

### Hardware
- PCB designs
- 3D printable cases
- Alternative lock mechanisms
- Wiring diagrams

### Testing
- Unit tests
- Integration tests
- End-to-end tests
- Load testing

## Development Resources

### Useful Commands

```bash
# Backend
npm run dev          # Development server
npm run build        # Production build
npm test             # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Firmware
pio run              # Build firmware
pio run -t upload    # Upload to ESP32
pio device monitor   # Serial monitor
pio test             # Run tests
```

### Project Structure

```
lock-in-responsible/
├── backend/          # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── prisma/
├── firmware/         # ESP32 firmware
│   ├── src/
│   └── include/
├── docs/            # Documentation
└── hardware/        # Hardware designs
```

## Questions?

- Open a GitHub issue
- Check existing documentation
- Review closed issues for similar questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Lock-In Responsible! 🎯
