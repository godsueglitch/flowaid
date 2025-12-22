// Product images - import specific brand images
import kotexNaturalBalance from "@/assets/products/kotex-natural-balance.jpg";
import alwaysMaxiPads from "@/assets/products/always-maxi-pads.jpg";
import stayfreePads from "@/assets/products/stayfree-pads.jpg";
import carefreLiners from "@/assets/products/carefree-liners.jpg";
import sanitaryPadsGeneric from "@/assets/products/sanitary-pads.jpg";
import musicInstruments from "@/assets/products/music-instruments.jpg";
import stationery from "@/assets/products/stationery.jpg";
import schoolBooks from "@/assets/products/school-books.jpg";
import schoolUniform from "@/assets/products/school-uniform.jpg";
import schoolMeals from "@/assets/products/school-meals.jpg";

// Map product names to their specific images
const productImageMap: Record<string, string> = {
  // Sanitary pad brands
  "kotex": kotexNaturalBalance,
  "kotex natural balance": kotexNaturalBalance,
  "kotex natural": kotexNaturalBalance,
  "always": alwaysMaxiPads,
  "always maxi": alwaysMaxiPads,
  "always maxi pads": alwaysMaxiPads,
  "always ultra": alwaysMaxiPads,
  "stayfree": stayfreePads,
  "stayfree pads": stayfreePads,
  "carefree": carefreLiners,
  "carefree liners": carefreLiners,
  "panty liners": carefreLiners,
  
  // Other supplies
  "music": musicInstruments,
  "music instruments": musicInstruments,
  "musical instruments": musicInstruments,
  "instruments": musicInstruments,
  "guitar": musicInstruments,
  "drums": musicInstruments,
  "keyboard": musicInstruments,
  
  "stationery": stationery,
  "pencils": stationery,
  "pens": stationery,
  "notebooks": stationery,
  "school supplies": stationery,
  
  "books": schoolBooks,
  "textbooks": schoolBooks,
  "school books": schoolBooks,
  "reading books": schoolBooks,
  
  "uniform": schoolUniform,
  "uniforms": schoolUniform,
  "school uniform": schoolUniform,
  "school uniforms": schoolUniform,
  
  "meals": schoolMeals,
  "food": schoolMeals,
  "lunch": schoolMeals,
  "breakfast": schoolMeals,
  "school meals": schoolMeals,
};

// Category fallback images
const categoryImageMap: Record<string, string> = {
  "sanitary_pads": sanitaryPadsGeneric,
  "books": schoolBooks,
  "uniforms": schoolUniform,
  "meals": schoolMeals,
  "music": musicInstruments,
  "stationery": stationery,
  "technology": stationery,
};

/**
 * Get the appropriate image for a product based on its name and category
 * @param productName - The name of the product
 * @param category - The category of the product
 * @param imageUrl - The image URL from the database (if any)
 * @returns The appropriate image URL
 */
export const getProductImage = (
  productName: string,
  category?: string,
  imageUrl?: string | null
): string => {
  // If there's a custom image URL from the database, use it
  if (imageUrl) {
    return imageUrl;
  }

  // Normalize the product name for matching
  const normalizedName = productName.toLowerCase().trim();

  // Check for exact or partial matches in product name
  for (const [key, image] of Object.entries(productImageMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return image;
    }
  }

  // Fall back to category image
  if (category && categoryImageMap[category]) {
    return categoryImageMap[category];
  }

  // Default to generic sanitary pads image
  return sanitaryPadsGeneric;
};

// Export individual images for direct use
export {
  kotexNaturalBalance,
  alwaysMaxiPads,
  stayfreePads,
  carefreLiners,
  sanitaryPadsGeneric,
  musicInstruments,
  stationery,
  schoolBooks,
  schoolUniform,
  schoolMeals,
};
