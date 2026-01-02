/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-constant-binary-expression */
import { cn } from './utils';
import { describe, it, expect } from 'vitest';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('p-4', 'bg-red-500')).toBe('p-4 bg-red-500');
  });

  it('handles conditional classes', () => {
    expect(cn('p-4', false && 'bg-red-500', 'text-white')).toBe('p-4 text-white');
  });

  it('merges tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});
