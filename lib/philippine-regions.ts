/**
 * Philippine Regions Mapping
 * Maps region codes to their full names
 */

export const regionNames: Record<string, string> = {
  "01": "Region 1 - Ilocos Region",
  "02": "Region 2 - Cagayan Valley",
  "03": "Region 3 - Central Luzon",
  "04": "Region 4-A - CALABARZON",
  "05": "Region 5 - Bicol Region",
  "06": "Region 6 - Western Visayas",
  "07": "Region 7 - Central Visayas",
  "08": "Region 8 - Eastern Visayas",
  "09": "Region 9 - Zamboanga Peninsula",
  "10": "Region 10 - Northern Mindanao",
  "11": "Region 11 - Davao Region",
  "12": "Region 12 - SOCCSKSARGEN",
  "13": "Region 13 - Caraga",
  "14": "NCR - National Capital Region",
  "15": "CAR - Cordillera Administrative Region",
  "16": "BARMM - Bangsamoro Autonomous Region in Muslim Mindanao",
  "17": "MIMAROPA - MIMAROPA Region",
};

/**
 * Convert Roman numerals to Arabic numerals in region names
 */
function convertRegionName(name: string): string {
  // Map Roman numerals to Arabic
  const romanToArabic: Record<string, string> = {
    "I": "1",
    "II": "2",
    "III": "3",
    "IV": "4",
    "V": "5",
    "VI": "6",
    "VII": "7",
    "VIII": "8",
    "IX": "9",
    "X": "10",
    "XI": "11",
    "XII": "12",
    "XIII": "13",
  };

  // Replace "Region I", "Region II", etc. with "Region 1", "Region 2", etc.
  let converted = name;
  for (const [roman, arabic] of Object.entries(romanToArabic)) {
    converted = converted.replace(new RegExp(`Region ${roman}\\b`, "gi"), `Region ${arabic}`);
    converted = converted.replace(new RegExp(`REGION ${roman}\\b`, "g"), `Region ${arabic}`);
  }

  // Handle special cases
  converted = converted.replace(/Region IV-A/gi, "Region 4-A");
  converted = converted.replace(/REGION IV-A/g, "Region 4-A");

  return converted;
}

/**
 * Get full region name with code, formatted as "Region X - Name"
 */
export function getRegionDisplayName(code: string, name: string): string {
  // Use mapping if available
  if (regionNames[code]) {
    return regionNames[code];
  }

  // Otherwise, convert the name and format it
  const convertedName = convertRegionName(name);
  
  // If it already has the format, return as is
  if (convertedName.match(/^Region \d+/i) || convertedName.includes("NCR") || convertedName.includes("CAR") || convertedName.includes("BARMM") || convertedName.includes("MIMAROPA")) {
    return convertedName;
  }

  // Otherwise, try to extract region number from code
  const regionNum = parseInt(code, 10);
  if (!isNaN(regionNum) && regionNum >= 1 && regionNum <= 17) {
    return regionNames[code] || `Region ${regionNum} - ${convertedName}`;
  }

  return convertedName;
}

/**
 * Sort regions alphabetically by display name
 */
export function sortRegionsAlphabetically<T extends { code: string; name: string }>(regions: T[]): T[] {
  return [...regions].sort((a, b) => {
    const nameA = getRegionDisplayName(a.code, a.name);
    const nameB = getRegionDisplayName(b.code, b.name);
    return nameA.localeCompare(nameB);
  });
}
