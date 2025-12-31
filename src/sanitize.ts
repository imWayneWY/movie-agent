// Sanitization utilities for LLM prompt injection prevention

/**
 * Common prompt injection patterns to detect and mitigate
 */
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /ignore\s+(?:previous|all|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /disregard\s+(?:all\s+)?(?:previous|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /disregard\s+(?:previous|all|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /forget\s+(?:all\s+)?(?:previous|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /forget\s+(?:previous|all|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /override\s+(?:all\s+)?(?:previous|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /override\s+(?:previous|all|the)\s+(?:instructions?|prompts?|commands?)/gi,
  /new\s+(?:instructions?|prompts?|commands?)[\s:]/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /user\s*:/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /```[\s\S]*?```/g, // Code blocks that might contain injection
  /\{[\s\S]*?"role"\s*:\s*"(system|assistant)"[\s\S]*?\}/gi, // JSON with role system
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

  // Truncate to maximum length
  if (sanitized.length > MAX_SANITIZED_LENGTH) {
    sanitized = sanitized.substring(0, MAX_SANITIZED_LENGTH);
  }

  // Remove common prompt injection patterns - replace with safe placeholder
  // Use a marker that won't be affected by later cleanup
  const FILTERED_MARKER = '___FILTERED___';
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, FILTERED_MARKER);
  }

  // Remove control characters except common whitespace (space, tab, newline)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Limit consecutive special characters (more than 3 in a row)
  sanitized = sanitized.replace(/([^\w\s])\1{3,}/g, '$1$1$1');

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

  // More flexible patterns for detection (not for replacement)
  const DETECTION_PATTERNS = [
    /ignore\s+.*(instructions?|prompts?|commands?)/gi,
    /disregard\s+.*(instructions?|prompts?|commands?)/gi,
    /forget\s+.*(instructions?|prompts?|commands?)/gi,
    /override\s+.*(instructions?|prompts?|commands?)/gi,
    /new\s+(instructions?|prompts?|commands?)/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /user\s*:/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /```/g,
  ];

  // Check against known patterns
  for (const pattern of DETECTION_PATTERNS) {
    if (pattern.test(inputStr)) {
      return true;
    }
  }

  // Check for suspicious character sequences
  if (/[<>{}[\]]{3,}/.test(inputStr)) {
    return true;
  }

  // Check for role-based injection patterns
  if (/"role"\s*:\s*"(system|assistant)"/i.test(inputStr)) {
    return true;
  }

  return false;
}
