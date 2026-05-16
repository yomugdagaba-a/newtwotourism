-- Remove all tourism images that are external URLs (not local uploads)
-- This ensures only locally uploaded images are used for tourism places

-- Remove external URLs from tourism_images table
DELETE FROM "tourism_images" 
WHERE "imageUrl" LIKE 'http%' 
AND "imageUrl" NOT LIKE '%localhost%';

-- Remove external URLs from tourism_places.imageUrl field
UPDATE "tourism_places"
SET "imageUrl" = NULL
WHERE "imageUrl" LIKE 'http%' 
AND "imageUrl" NOT LIKE '%localhost%';

-- Remove external URLs from hero_images table
DELETE FROM "hero_images" 
WHERE "imageUrl" LIKE 'http%' 
AND "imageUrl" NOT LIKE '%localhost%';

-- Log summary
-- SELECT 
--   (SELECT COUNT(*) FROM "tourism_images" WHERE "imageUrl" LIKE '/uploads%') as local_tourism_images,
--   (SELECT COUNT(*) FROM "hero_images" WHERE "imageUrl" LIKE '/uploads%') as local_hero_images;
