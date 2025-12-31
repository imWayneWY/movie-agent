// Sanitization utilities for LLM prompt injection prevention

/**
 * Common prompt injection patterns to detect and mitigate
 * Using consolidated patterns for better performance and maintainability
 */
const PROMPT_INJECTION_PATTERNS = [
  // Action-based injections: "ignore/disregard/forget/override [all] [previous/the] instructions/prompts/commands"
  /(?:ignore|disregard|forget|override)\s+(?:all\s+)?(?:previous|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /(?:ignore|disregard|forget|override)\s+(?:previous|all|the)\s+(?:instructions?|prompts?|commands?)/gi,
  // New instruction attempts
  /new\s+(?:instructions?|prompts?|commands?)[\s:]/gi,
  // Role-based injections
  /(?:system|assistant|user)\s*:/gi,
  // Model-specific control tokens
  /\[INST\]|\[\/INST\]/gi,
  /<\|im_start\|>|<\|im_end\|>/gi,
  // Code blocks (limited to reasonable size to prevent ReDoS)
  /```[^`]{0,1000}```/g,
  // Role injection in JSON format
  /\{[^}]{0,500}"role"\s*:\s*"(?:system|assistant)"[^}]{0,500}\}/gi,
];

/**
 * Maximum lengths for different input types (defense in depth with existing validation)
 */
const MAX_SANITIZED_LENGTH = 500;

/**
 * Sanitizes user input to prevent prompt injection attacks
 * This is specifically for content that will be passed to LLM prompts
 * 
 * @param input - Raw user input object
 * @returns Sanitized version safe for LLM prompts
 */
export function sanitizeForLLMPrompt(input: any): any {
  if (input === null || input === undefined) {
    return input;
  }

  // Handle primitive types
  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }

  // Handle arrays
  if (Array.isArray(input)) {
    return input.map(item => sanitizeForLLMPrompt(item));
  }

  // Handle objects recursively
  if (typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize both key and value
      const sanitizedKey = sanitizeString(String(key));
      sanitized[sanitizedKey] = sanitizeForLLMPrompt(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Sanitizes a string to remove potential prompt injection attacks
 * 
 * @param str - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  let sanitized = str;

  // Truncate to maximum length early to prevent expensive operations on large strings
  if (sanitized.length > MAX_SANITIZED_LENGTH) {
    sanitized = sanitized.substring(0, MAX_SANITIZED_LENGTH);
  }

  // Remove common prompt injection patterns - replace with safe placeholder
  // Use a marker that won't be affected by later cleanup
  const FILTERED_MARKER = '___FILTERED___';
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    // Reset regex state to ensure consistent behavior with global flag
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, FILTERED_MARKER);
  }

  // Remove control characters except common whitespace (space, tab, newline)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit consecutive special characters (more than 3 in a row) - more efficient than nested quantifiers
  // Only process if the string contains special characters
  if (/[^\w\s]/.test(sanitized)) {
    sanitized = sanitized.replace(/([^\w\s])\1{3,}/g, '$1$1$1');
  }

  // Remove any remaining potential instruction delimiters (but preserve our marker)
  sanitized = sanitized.replace(/[<>{}[\]]/g, ' ');

  // Clean up multiple spaces created by replacements
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Replace marker with user-friendly text
  sanitized = sanitized.replace(new RegExp(FILTERED_MARKER, 'g'), '[filtered]');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Detects if input contains potential prompt injection attempts
 * This is for logging/monitoring purposes
 * 
 * @param input - Input to check
 * @returns True if potential injection detected
 */
export function detectPromptInjection(input: any): boolean {
  if (!input) {
    return false;
  }

  const inputStr = typeof input === 'string' 
    ? input 
    : JSON.stringify(input);

  // Early termination for very large inputs to prevent performance issues
  const CHECK_LENGTH_LIMIT = 10000;
  const truncatedInput = inputStr.length > CHECK_LENGTH_LIMIT 
    ? inputStr.substring(0, CHECK_LENGTH_LIMIT) 
    : inputStr;

  // Reuse sanitization patterns for consistency
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    // Reset regex state for reuse
    pattern.lastIndex = 0;
    if (pattern.test(truncatedInput)) {
      return true;
    }
  }

  // Additional checks for suspicious character sequences
  if (/[<>{}[\]]{3,}/.test(truncatedInput)) {
    return true;
  }

  return false;
}
