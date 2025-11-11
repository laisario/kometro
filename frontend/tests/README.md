# Frontend Tests

This directory contains Jest tests for the frontend React components.

## Test Structure

```
tests/
├── components/           # Component tests
│   ├── CreateInstrument.test.jsx
│   └── FormDefaultAsset.test.jsx
├── utils/               # Test utilities and helpers
│   └── test-utils.jsx
├── __mocks__/           # Mock files
│   ├── react-query.js
│   └── react-hook-form.js
├── setup.js            # Jest setup file
└── README.md           # This file
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Configuration

- **Jest**: Testing framework
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers
- **@testing-library/user-event**: User interaction simulation
- **jsdom**: DOM environment for tests

## Test Utilities

### `test-utils.jsx`
Provides custom render function with all necessary providers:
- React Query Client
- Material-UI Theme
- Date Picker Localization

### Mock Data
- `mockAsset`: Complete asset object for testing
- `mockDefaultAssets`: List of default instruments
- `mockSetores`: Sector hierarchy data
- `mockNormas`: Legal norms data
- `mockCliente`: Client data

## Writing Tests

### Component Testing
Each component test file should include:
1. **Rendering tests**: Verify component renders correctly
2. **Interaction tests**: Test user interactions
3. **Form submission tests**: Test form behavior
4. **Error handling tests**: Test error states
5. **Accessibility tests**: Test a11y features

### Mocking
- Use `jest.mock()` to mock external dependencies
- Mock hooks and API calls
- Use `createMockProps()` helper for consistent prop creation

### Best Practices
- Use `userEvent` for realistic user interactions
- Test both success and error scenarios
- Use descriptive test names
- Group related tests with `describe` blocks
- Clean up mocks in `beforeEach`

## Coverage

Tests aim for:
- **Statements**: > 80%
- **Branches**: > 80%
- **Functions**: > 80%
- **Lines**: > 80%

Coverage reports are generated in the `coverage/` directory.
