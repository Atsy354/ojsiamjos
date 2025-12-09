/**
 * Validation Utilities
 * 
 * Client-side validation functions for authentication forms
 */

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check password strength
 * @param password - Password to check
 * @returns Object with strength score (0-5) and requirements met
 */
export function checkPasswordStrength(password: string): {
    score: number;
    requirements: {
        length: boolean;
        uppercase: boolean;
        lowercase: boolean;
        number: boolean;
        special: boolean;
    };
    message: string;
} {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;

    let message = '';
    if (score === 0) message = 'Very Weak';
    else if (score === 1) message = 'Weak';
    else if (score === 2) message = 'Fair';
    else if (score === 3) message = 'Good';
    else if (score === 4) message = 'Strong';
    else message = 'Very Strong';

    return { score, requirements, message };
}

/**
 * Validate password meets minimum requirements
 * @param password - Password to validate
 * @returns true if meets requirements, false otherwise
 */
export function validatePassword(password: string): boolean {
    const { requirements } = checkPasswordStrength(password);
    // Minimum requirements: length, uppercase, lowercase, number
    return requirements.length && requirements.uppercase && requirements.lowercase && requirements.number;
}

/**
 * Get password strength color for UI
 * @param score - Strength score (0-5)
 * @returns CSS color string
 */
export function getPasswordStrengthColor(score: number): string {
    if (score <= 1) return '#d00a0a'; // Red (Submission)
    if (score === 2) return '#e08914'; // Orange (Review)
    if (score === 3) return '#006798'; // Blue (Copyediting)
    return '#00b28d'; // Green (Production)
}

/**
 * Validate return URL to prevent open redirect attacks
 * @param url - URL to validate
 * @returns true if safe, false otherwise
 */
export function validateReturnUrl(url: string): boolean {
    // Must start with / but not //
    return url.startsWith('/') && !url.startsWith('//');
}
