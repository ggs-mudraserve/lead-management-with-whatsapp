/**
 * Environment variables utility
 * 
 * This file provides a centralized way to access environment variables
 * with proper typing and default values.
 */

// Supabase configuration
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// WhatsApp configuration
export const WHATSAPP_API_VERSION = process.env.NEXT_PUBLIC_WHATSAPP_API_VERSION || 'v18.0';
export const WHATSAPP_PHONE_NUMBER_ID = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || '';
export const WHATSAPP_ACCESS_TOKEN = process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN || '';

// Application configuration
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

// Data privacy configuration
export const MOBILE_MASKING_DAYS = parseInt(process.env.NEXT_PUBLIC_MOBILE_MASKING_DAYS || '20', 10);
