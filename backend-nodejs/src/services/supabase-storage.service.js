const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://gclzstgdcguzocxxgkdv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.warn('⚠️  SUPABASE_SERVICE_KEY not set. File uploads will fail.');
}

const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Upload a file to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - The file name
 * @param {string} bucket - The storage bucket name (e.g., 'tourism-images', 'hotel-images')
 * @param {string} contentType - The file MIME type
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
async function uploadFile(fileBuffer, fileName, bucket, contentType) {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please set SUPABASE_SERVICE_KEY.');
  }

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} fileUrl - The full public URL of the file
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<void>}
 */
async function deleteFile(fileUrl, bucket) {
  if (!supabase) {
    console.warn('Supabase client not initialized. Skipping file deletion.');
    return;
  }

  try {
    // Extract file path from URL
    const urlParts = fileUrl.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      console.warn('Invalid file URL format:', fileUrl);
      return;
    }
    
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      // Don't throw - deletion failures shouldn't break the app
    }
  } catch (error) {
    console.error('Delete error:', error);
    // Don't throw - deletion failures shouldn't break the app
  }
}

/**
 * Check if Supabase Storage is configured
 * @returns {boolean}
 */
function isConfigured() {
  return !!supabase;
}

module.exports = {
  uploadFile,
  deleteFile,
  isConfigured,
};
