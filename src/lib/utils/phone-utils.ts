/**
 * Utility functions for phone number formatting and manipulation
 */

/**
 * Masks a mobile number for privacy, showing only the last 4 digits
 * @param mobile The mobile number to mask
 * @returns The masked mobile number
 */
export const maskMobileNumber = (mobile: string): string => {
  if (!mobile || mobile.length <= 4) {
    return mobile; // Return original if invalid or too short
  }
  return 'XXXXXX' + mobile.slice(-4);
};
