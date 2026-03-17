/**
 * Location Service - Maps Ethiopian wereda/kebele to approximate coordinates
 * This allows us to show tourism places on a map without storing coordinates in the database
 */

import { LocationCoordinates } from "@/types/map";

// Approximate coordinates for major Ethiopian weredas
// These are central points for each wereda
const WEREDA_COORDINATES: Record<string, LocationCoordinates> = {
  // Addis Ababa
  "addis ababa": { latitude: 9.0320, longitude: 38.7469 },
  "addis": { latitude: 9.0320, longitude: 38.7469 },
  
  // Oromia Region
  "adama": { latitude: 8.5383, longitude: 39.2665 },
  "adama wereda": { latitude: 8.5383, longitude: 39.2665 },
  "adis alem": { latitude: 8.9667, longitude: 38.7667 },
  "bishoftu": { latitude: 8.7469, longitude: 39.0083 },
  "debre birhan": { latitude: 9.6833, longitude: 39.5167 },
  "debre zeit": { latitude: 8.7469, longitude: 39.0083 },
  "dire dawa": { latitude: 9.6412, longitude: 41.8687 },
  "harar": { latitude: 9.3136, longitude: 42.1553 },
  "jigjiga": { latitude: 9.3505, longitude: 42.7742 },
  "jijiga": { latitude: 9.3505, longitude: 42.7742 },
  "adama city": { latitude: 8.5383, longitude: 39.2665 },
  "modjo": { latitude: 8.6667, longitude: 39.1667 },
  "modjo wereda": { latitude: 8.6667, longitude: 39.1667 },
  "dukem": { latitude: 8.8333, longitude: 39.3333 },
  "dukem wereda": { latitude: 8.8333, longitude: 39.3333 },
  "sebeta": { latitude: 8.95, longitude: 38.6333 },
  "sebeta wereda": { latitude: 8.95, longitude: 38.6333 },
  "holeta": { latitude: 9.0667, longitude: 38.5 },
  "holeta wereda": { latitude: 9.0667, longitude: 38.5 },
  "addis alem wereda": { latitude: 8.9667, longitude: 38.7667 },
  
  // Amhara Region
  "bahir dar": { latitude: 11.5921, longitude: 37.3954 },
  "bahar dar": { latitude: 11.5921, longitude: 37.3954 },
  "gondar": { latitude: 12.6047, longitude: 37.4669 },
  "gonder": { latitude: 12.6047, longitude: 37.4669 },
  "dessie": { latitude: 11.1333, longitude: 39.6333 },
  "dessi": { latitude: 11.1333, longitude: 39.6333 },
  "desie": { latitude: 11.1333, longitude: 39.6333 },
  "woldia": { latitude: 11.5667, longitude: 39.6 },
  "woldiya": { latitude: 11.5667, longitude: 39.6 },
  "woldya": { latitude: 11.5667, longitude: 39.6 },
  "kombolcha": { latitude: 11.0833, longitude: 39.75 },
  "kombolcha wereda": { latitude: 11.0833, longitude: 39.75 },
  
  // North Wollo Weredas (Lalibela Area)
  "lalibela": { latitude: 12.0269, longitude: 39.0471 },
  "north wollo": { latitude: 12.0269, longitude: 39.0471 },
  "north wollo wereda": { latitude: 12.0269, longitude: 39.0471 },
  "lasta": { latitude: 12.0269, longitude: 39.0471 },
  "lasta wereda": { latitude: 12.0269, longitude: 39.0471 },
  "wegelt": { latitude: 12.0269, longitude: 39.0471 },
  "wegelt wereda": { latitude: 12.0269, longitude: 39.0471 },
  "gidan": { latitude: 12.0269, longitude: 39.0471 },
  "gidan wereda": { latitude: 12.0269, longitude: 39.0471 },
  "sekota": { latitude: 12.3333, longitude: 39.0 },
  "sekota wereda": { latitude: 12.3333, longitude: 39.0 },
  "wag": { latitude: 12.5, longitude: 39.2 },
  "wag wereda": { latitude: 12.5, longitude: 39.2 },
  "bugna": { latitude: 12.1667, longitude: 39.3333 },
  "bugna wereda": { latitude: 12.1667, longitude: 39.3333 },
  
  // Lalibela Kebeles
  "yimrehane kristos": { latitude: 12.0269, longitude: 39.0471 },
  "yimrehane kristos church": { latitude: 12.0269, longitude: 39.0471 },
  "lalibela kebele": { latitude: 12.0269, longitude: 39.0471 },
  "addis alem": { latitude: 12.0269, longitude: 39.0471 },
  "addis alem kebele": { latitude: 12.0269, longitude: 39.0471 },
  "bete giorgis": { latitude: 12.0269, longitude: 39.0471 },
  "bete maryam": { latitude: 12.0269, longitude: 39.0471 },
  "bete medhane alem": { latitude: 12.0269, longitude: 39.0471 },
  
  "mekelle": { latitude: 13.4833, longitude: 39.4833 },
  "mekele": { latitude: 13.4833, longitude: 39.4833 },
  
  // SNNPR/Southwest Ethiopia
  "arba minch": { latitude: 5.9833, longitude: 37.5333 },
  "arbaminch": { latitude: 5.9833, longitude: 37.5333 },
  "arbatu": { latitude: 5.9833, longitude: 37.5333 },
  "arbatu ensessa": { latitude: 5.9833, longitude: 37.5333 },
  "hawassa": { latitude: 5.0269, longitude: 38.4806 },
  "jimma": { latitude: 7.6667, longitude: 36.8333 },
  "jima": { latitude: 7.6667, longitude: 36.8333 },
  "mizan teferi": { latitude: 7.3333, longitude: 35.3833 },
  "mizan": { latitude: 7.3333, longitude: 35.3833 },
  "sodo": { latitude: 6.8333, longitude: 37.7667 },
  "wolaita sodo": { latitude: 6.8333, longitude: 37.7667 },
  "konso": { latitude: 5.2667, longitude: 37.1 },
  "konso wereda": { latitude: 5.2667, longitude: 37.1 },
  "bale": { latitude: 7.4, longitude: 40.2 },
  "bale wereda": { latitude: 7.4, longitude: 40.2 },
  "gurage": { latitude: 8.8333, longitude: 37.8333 },
  "gurage wereda": { latitude: 8.8333, longitude: 37.8333 },
  
  // Tigray Region
  "aksum": { latitude: 14.1289, longitude: 38.7169 },
  "axum": { latitude: 14.1289, longitude: 38.7169 },
  "adwa": { latitude: 14.1667, longitude: 38.9 },
  "adua": { latitude: 14.1667, longitude: 38.9 },
  "adigrat": { latitude: 14.2833, longitude: 39.4667 },
  "adigrat wereda": { latitude: 14.2833, longitude: 39.4667 },
  "wukro": { latitude: 13.8, longitude: 39.6 },
  "wukro wereda": { latitude: 13.8, longitude: 39.6 },
  "maychew": { latitude: 13.9, longitude: 39.5 },
  "maychew wereda": { latitude: 13.9, longitude: 39.5 },
  "mekelle wereda": { latitude: 13.4833, longitude: 39.4833 },
  
  // Somali Region
  "borama": { latitude: 9.5833, longitude: 43.1333 },
  "burao": { latitude: 9.5167, longitude: 44.9 },
  
  // Afar Region
  "assab": { latitude: 13.7667, longitude: 42.7333 },
  "assaita": { latitude: 11.7667, longitude: 41.8 },
  
  // Benishangul-Gumuz Region
  "assosa": { latitude: 10.0333, longitude: 34.5667 },
  "assossa": { latitude: 10.0333, longitude: 34.5667 },
  
  // Gambela Region
  "gambela": { latitude: 8.25, longitude: 34.5833 },
  "gambella": { latitude: 8.25, longitude: 34.5833 },
  
  // Lake Tana Area
  "lake tana": { latitude: 11.8, longitude: 37.3 },
  "tana": { latitude: 11.8, longitude: 37.3 },
  
  // Abuna Yosef Area
  "abuna yosef": { latitude: 11.8, longitude: 39.5 },
  "abuna yossef": { latitude: 11.8, longitude: 39.5 },
  "abuna yosif": { latitude: 11.8, longitude: 39.5 },
};

/**
 * Get approximate coordinates for a wereda/kebele
 * Falls back to Addis Ababa if location not found
 */
export const getLocationCoordinates = (wereda?: string, kebele?: string): LocationCoordinates => {
  if (!wereda) {
    // Default to Addis Ababa
    return { latitude: 9.0320, longitude: 38.7469 };
  }

  const searchKey = wereda.toLowerCase().trim();
  
  // Try exact match first
  if (WEREDA_COORDINATES[searchKey]) {
    return WEREDA_COORDINATES[searchKey];
  }

  // Try partial match - check if any key is contained in the search term
  for (const [key, coords] of Object.entries(WEREDA_COORDINATES)) {
    if (searchKey.includes(key) || key.includes(searchKey)) {
      return coords;
    }
  }

  // Try word-by-word matching for multi-word locations
  const words = searchKey.split(/\s+/);
  for (const word of words) {
    if (word.length > 2) { // Skip very short words
      for (const [key, coords] of Object.entries(WEREDA_COORDINATES)) {
        if (key.includes(word) || word.includes(key)) {
          return coords;
        }
      }
    }
  }

  // Default to Addis Ababa if not found
  console.warn(`[LocationService] Location not found: "${wereda}", using Addis Ababa as fallback`);
  return { latitude: 9.0320, longitude: 38.7469 };
};

/**
 * Add slight random offset to coordinates to avoid exact overlap
 * when multiple places are in the same wereda
 */
export const addCoordinateOffset = (
  coords: LocationCoordinates,
  offsetKm: number = 0.5
): LocationCoordinates => {
  // 1 degree ≈ 111 km
  const offsetDegrees = offsetKm / 111;
  
  // Random offset in all directions
  const randomLat = (Math.random() - 0.5) * 2 * offsetDegrees;
  const randomLon = (Math.random() - 0.5) * 2 * offsetDegrees;

  return {
    latitude: coords.latitude + randomLat,
    longitude: coords.longitude + randomLon,
  };
};

/**
 * Search for tourism place using Nominatim (OpenStreetMap's geocoding service)
 * This searches for the specific tourism place name in the given wereda/kebele
 */
export const searchTourismPlaceLocation = async (
  tourismName: string,
  wereda?: string,
  kebele?: string
): Promise<LocationCoordinates | null> => {
  try {
    console.log(`🔍 Searching for: "${tourismName}" in ${kebele || wereda}`);
    
    // Try multiple search strategies
    const searchQueries = [
      // Strategy 1: Full address with kebele
      kebele ? `${tourismName}, ${kebele}, ${wereda}, Ethiopia` : null,
      // Strategy 2: Just tourism name and wereda
      `${tourismName}, ${wereda}, Ethiopia`,
      // Strategy 3: Just tourism name
      `${tourismName}, Ethiopia`,
      // Strategy 4: Tourism name with common keywords
      `${tourismName} church Ethiopia`,
      `${tourismName} monastery Ethiopia`,
      `${tourismName} cave Ethiopia`,
      `${tourismName} lake Ethiopia`,
      `${tourismName} mountain Ethiopia`,
    ].filter(Boolean) as string[];

    for (const searchQuery of searchQueries) {
      try {
        console.log(`  Trying: "${searchQuery}"`);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=et`,
          {
            headers: {
              'User-Agent': 'TourismApp/1.0',
            },
          }
        );

        if (!response.ok) {
          console.warn(`    Status: ${response.status}`);
          continue;
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          const coords = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          };
          console.log(`  ✅ Found at:`, coords, `(${result.display_name})`);
          return coords;
        }
        console.log(`    No results`);
      } catch (err) {
        console.warn(`    Error:`, err);
        continue;
      }

      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`❌ Tourism place not found in any search`);
    return null;
  } catch (error) {
    console.warn("Tourism place search error:", error);
    return null;
  }
};
