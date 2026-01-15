import fs from 'fs';
import path from 'path';

// Cache the loaded JSON data
let locationsData: any = null;
let dataLoadError: Error | null = null;

/**
 * Load the Philippine locations JSON file
 */
function loadLocationsData() {
  if (locationsData !== null) {
    return { data: locationsData, error: dataLoadError };
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'philippine-locations.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    locationsData = JSON.parse(fileContent);
    dataLoadError = null;
    return { data: locationsData, error: null };
  } catch (error) {
    dataLoadError = error instanceof Error ? error : new Error(String(error));
    console.error('[Philippine Locations] Failed to load JSON file:', error);
    return { data: null, error: dataLoadError };
  }
}

/**
 * Get all regions
 */
export function getRegions(): Array<{ code: string; name: string }> {
  const { data, error } = loadLocationsData();
  if (error || !data) {
    return [];
  }

  return Object.entries(data).map(([code, region]: [string, any]) => ({
    code,
    name: region.region_name || code,
  }));
}

/**
 * Get provinces for a region
 */
export function getProvinces(regionCode: string): Array<{ code: string; name: string }> {
  const { data, error } = loadLocationsData();
  if (error || !data || !data[regionCode]) {
    return [];
  }

  const region = data[regionCode];
  if (!region.province_list) {
    return [];
  }

  return Object.keys(region.province_list).map((provinceName) => {
    // Generate a code from the province name (normalize and use as identifier)
    // In a real scenario, you'd want a proper mapping, but for now use name as code
    const code = provinceName.toUpperCase().replace(/\s+/g, '_');
    return {
      code: code,
      name: provinceName,
    };
  });
}

/**
 * Get cities/municipalities for a province
 */
export function getCities(regionCode: string, provinceName: string): Array<{ code: string; name: string }> {
  const { data, error } = loadLocationsData();
  if (error || !data || !data[regionCode]) {
    return [];
  }

  const region = data[regionCode];
  if (!region.province_list || !region.province_list[provinceName]) {
    return [];
  }

  const province = region.province_list[provinceName];
  if (!province.municipality_list) {
    return [];
  }

  return Object.keys(province.municipality_list).map((cityName) => {
    const code = cityName.toUpperCase().replace(/\s+/g, '_');
    return {
      code: code,
      name: cityName,
    };
  });
}

/**
 * Convert a string to title case (proper case)
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Handle special cases like "Pob.)", "(Pob.)", etc.
      if (word.includes('(') || word.includes(')')) {
        // Keep the structure but capitalize first letter
        const parts = word.split(/([()])/);
        return parts.map((part, i) => {
          if (part === '(' || part === ')') return part;
          return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('');
      }
      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Get barangays for a city/municipality
 */
export function getBarangays(
  regionCode: string,
  provinceName: string,
  cityName: string
): Array<{ code: string; name: string }> {
  const { data, error } = loadLocationsData();
  if (error || !data || !data[regionCode]) {
    return [];
  }

  const region = data[regionCode];
  if (!region.province_list || !region.province_list[provinceName]) {
    return [];
  }

  const province = region.province_list[provinceName];
  if (!province.municipality_list || !province.municipality_list[cityName]) {
    return [];
  }

  const city = province.municipality_list[cityName];
  if (!city.barangay_list || !Array.isArray(city.barangay_list)) {
    return [];
  }

  return city.barangay_list.map((barangayName: string, index: number) => {
    // Normalize the barangay name to title case
    const normalizedName = toTitleCase(barangayName);
    return {
      code: `${regionCode}-${provinceName}-${cityName}-${index}`, // Generate a unique code
      name: normalizedName,
    };
  });
}

/**
 * Find province by name (case-insensitive partial match)
 */
export function findProvinceByName(regionCode: string, searchName: string): string | null {
  const { data, error } = loadLocationsData();
  if (error || !data || !data[regionCode]) {
    return null;
  }

  const region = data[regionCode];
  if (!region.province_list) {
    return null;
  }

  const searchLower = searchName.toLowerCase();
  const provinceKey = Object.keys(region.province_list).find(
    (name) => name.toLowerCase() === searchLower || name.toLowerCase().includes(searchLower)
  );

  return provinceKey || null;
}

/**
 * Find city by name (case-insensitive partial match)
 */
export function findCityByName(regionCode: string, provinceName: string, searchName: string): string | null {
  const { data, error } = loadLocationsData();
  if (error || !data || !data[regionCode]) {
    return null;
  }

  const region = data[regionCode];
  if (!region.province_list || !region.province_list[provinceName]) {
    return null;
  }

  const province = region.province_list[provinceName];
  if (!province.municipality_list) {
    return null;
  }

  const searchLower = searchName.toLowerCase();
  const cityKey = Object.keys(province.municipality_list).find(
    (name) => name.toLowerCase() === searchLower || name.toLowerCase().includes(searchLower)
  );

  return cityKey || null;
}

/**
 * Search for provinces by code (PSGC format) - tries to match region code prefix
 */
export function findProvincesByCode(regionCode: string): Array<{ code: string; name: string }> {
  // The JSON uses region codes like "01", "02", etc.
  // PSGC codes might be longer like "0100000000"
  // Extract short region code
  let shortRegionCode = regionCode;
  if (regionCode.length >= 2) {
    shortRegionCode = regionCode.substring(0, 2);
  }

  return getProvinces(shortRegionCode);
}

/**
 * Search for cities by code - tries to match by finding province first
 */
export function findCitiesByCode(regionCode: string, provinceCode: string): Array<{ code: string; name: string }> {
  // Try to find province by code/name matching
  // First, get all provinces for the region
  const provinces = getProvinces(regionCode);
  
  // Try to match province code to province name
  // This is a fallback - ideally we'd have a proper mapping
  // For now, try exact match or partial match
  const provinceName = provinces.find(
    (p) => p.code.toLowerCase() === provinceCode.toLowerCase() ||
           p.name.toLowerCase().includes(provinceCode.toLowerCase()) ||
           provinceCode.toLowerCase().includes(p.name.toLowerCase())
  )?.name;

  if (!provinceName) {
    return [];
  }

  return getCities(regionCode, provinceName);
}

/**
 * Search for barangays by code - tries to match by finding city first
 */
export function findBarangaysByCode(
  regionCode: string,
  provinceCode: string,
  cityCode: string
): Array<{ code: string; name: string }> {
  // Try to find province and city by code/name matching
  const provinces = getProvinces(regionCode);
  const provinceName = provinces.find(
    (p) => p.code.toLowerCase() === provinceCode.toLowerCase() ||
           p.name.toLowerCase().includes(provinceCode.toLowerCase()) ||
           provinceCode.toLowerCase().includes(p.name.toLowerCase())
  )?.name;

  if (!provinceName) {
    return [];
  }

  const cities = getCities(regionCode, provinceName);
  const cityName = cities.find(
    (c) => c.code.toLowerCase() === cityCode.toLowerCase() ||
           c.name.toLowerCase().includes(cityCode.toLowerCase()) ||
           cityCode.toLowerCase().includes(c.name.toLowerCase())
  )?.name;

  if (!cityName) {
    return [];
  }

  return getBarangays(regionCode, provinceName, cityName);
}
