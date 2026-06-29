import { describe, it, expect } from 'bun:test';

// Example utility to test
function formatUser(user: { name: string, email: string }) {
  return `${user.name} <${user.email}>`;
}

describe('formatUser utility', () => {
  it('should format user correctly', () => {
    const user = { name: 'John Doe', email: 'john@example.com' };
    expect(formatUser(user)).toBe('John Doe <john@example.com>');
  });
});
