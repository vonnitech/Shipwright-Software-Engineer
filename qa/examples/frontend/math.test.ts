import { describe, it, expect } from 'vitest';

// Example function to test
function add(a: number, b: number) {
  return a + b;
}

describe('add function', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, 1)).toBe(0);
  });
});
