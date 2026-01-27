/**
 * Email normalization helper.
 * Used consistently across signup, login, and password reset flows
 * to ensure case-insensitive email matching.
 */

/**
 * Normalizes an email address by trimming whitespace and converting to lowercase.
 * This ensures consistent email storage and lookup across the application.
 * 
 * @param email - The raw email input from user
 * @returns Normalized email (lowercase, trimmed)
 * 
 * @example
 * normalizeEmail('  User@Example.COM  ') // returns 'user@example.com'
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
