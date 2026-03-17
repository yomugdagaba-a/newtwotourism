-- Update Road 2: Desse with all distance types
UPDATE "road_infos" 
SET "condition" = '{"distanceByCar": 560, "distanceByFoot": 750, "distanceByHorse": 600, "distanceByPlane": 1.2, "totalDistance": 560}'
WHERE "id" = 2;

-- Update Road 3: Addis Ababa with all distance types
UPDATE "road_infos" 
SET "condition" = '{"distanceByCar": 650, "distanceByFoot": 850, "distanceByHorse": 700, "distanceByPlane": 1.5, "totalDistance": 650}'
WHERE "id" = 3;

-- Verify the updates
SELECT id, name, type, distance, condition FROM "road_infos" WHERE "id" IN (2, 3);
