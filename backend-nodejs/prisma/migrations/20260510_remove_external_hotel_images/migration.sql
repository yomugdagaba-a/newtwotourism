-- Remove all hotel images that are external URLs (not local uploads)
-- This ensures only locally uploaded images are used

DELETE FROM "hotel_images" 
WHERE "imageUrl" LIKE 'http%' 
AND "imageUrl" NOT LIKE '%localhost%';

-- Optional: Log what was removed
-- SELECT COUNT(*) as removed_count FROM "hotel_images" WHERE "imageUrl" LIKE 'http%' AND "imageUrl" NOT LIKE '%localhost%';
