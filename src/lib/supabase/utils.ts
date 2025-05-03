import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Checks if a file exists in Supabase storage
 * 
 * @param supabase Supabase client instance
 * @param bucketName Name of the storage bucket
 * @param filePath Path to the file within the bucket
 * @returns Promise<boolean> True if file exists, false otherwise
 */
export async function checkFileExists(
  supabase: SupabaseClient,
  bucketName: string,
  filePath: string
): Promise<boolean> {
  try {
    // Try to get the file metadata - this will fail if the file doesn't exist
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 1); // 1 second validity is enough to check existence
    
    if (error) {
      console.error(`File existence check error for ${filePath}:`, error);
      return false;
    }
    
    return !!data?.signedUrl;
  } catch (error) {
    console.error(`Error checking if file exists at ${filePath}:`, error);
    return false;
  }
}
