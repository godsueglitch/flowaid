// Product images - import specific brand images
import kotexNaturalBalance from "@/assets/products/kotex-natural-balance.jpg";
import alwaysMaxiPads from "@/assets/products/always-maxi-pads.jpg";
import stayfreePads from "@/assets/products/stayfree-pads.jpg";
import carefreLiners from "@/assets/products/carefree-liners.jpg";
import sanitaryPadsGeneric from "@/assets/products/sanitary-pads.jpg";
import musicInstruments from "@/assets/products/music-instruments.jpg";
import stationery from "@/assets/products/stationery.jpg";
import textbooks from "@/assets/products/textbooks.jpg";
import libraryBooks from "@/assets/products/library-books.jpg";
import laptopsTablets from "@/assets/products/laptops-tablets.jpg";
import schoolUniformSet from "@/assets/products/school-uniform-set.jpg";
import schoolMeals from "@/assets/products/school-meals.jpg";
import sportsEquipment from "@/assets/products/sports-equipment.jpg";
import desksChairs from "@/assets/products/desks-chairs.jpg";
import artSupplies from "@/assets/products/art-supplies.jpg";
import scienceLab from "@/assets/products/science-lab.jpg";
import schoolBackpacks from "@/assets/products/school-backpacks.jpg";

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
  
  // Books
  "textbook": textbooks,
  "textbooks": textbooks,
  "textbooks set": textbooks,
  "math": textbooks,
  "science": textbooks,
  "english": textbooks,
  "library": libraryBooks,
  "library books": libraryBooks,
  "storybook": libraryBooks,
  "storybooks": libraryBooks,
  "reading": libraryBooks,
  
  // Technology
  "laptop": laptopsTablets,
  "laptops": laptopsTablets,
  "laptop computer": laptopsTablets,
  "computer": laptopsTablets,
  "computers": laptopsTablets,
  "tablet": laptopsTablets,
  "tablets": laptopsTablets,
  "ipad": laptopsTablets,
  "technology": laptopsTablets,
  
  // Music
  "music": musicInstruments,
  "music instruments": musicInstruments,
  "musical instruments": musicInstruments,
  "instruments": musicInstruments,
  "guitar": musicInstruments,
  "drums": musicInstruments,
  "keyboard": musicInstruments,
  "piano": musicInstruments,
  
  // Stationery
  "stationery": stationery,
  "pencils": stationery,
  "pens": stationery,
  "notebooks": stationery,
  "school supplies": stationery,
  "writing": stationery,
  
  // Uniforms
  "uniform": schoolUniformSet,
  "uniforms": schoolUniformSet,
  "school uniform": schoolUniformSet,
  "school uniforms": schoolUniformSet,
  "shirt": schoolUniformSet,
  "skirt": schoolUniformSet,
  "pants": schoolUniformSet,
  
  // Meals/Food
  "meals": schoolMeals,
  "meal": schoolMeals,
  "food": schoolMeals,
  "lunch": schoolMeals,
  "breakfast": schoolMeals,
  "school meals": schoolMeals,
  "feeding": schoolMeals,
  
  // Sports
  "sports": sportsEquipment,
  "sport": sportsEquipment,
  "sports equipment": sportsEquipment,
  "basketball": sportsEquipment,
  "soccer": sportsEquipment,
  "football": sportsEquipment,
  "volleyball": sportsEquipment,
  "jump rope": sportsEquipment,
  "pe": sportsEquipment,
  "physical education": sportsEquipment,
  
  // Furniture - Desks and Chairs
  "desk": desksChairs,
  "desks": desksChairs,
  "chair": desksChairs,
  "chairs": desksChairs,
  "table": desksChairs,
  "tables": desksChairs,
  "table set": desksChairs,
  "desk and chair": desksChairs,
  "desks and chairs": desksChairs,
  "furniture": desksChairs,
  "classroom furniture": desksChairs,
  
  // Art Supplies
  "art": artSupplies,
  "art supplies": artSupplies,
  "paint": artSupplies,
  "paints": artSupplies,
  "painting": artSupplies,
  "canvas": artSupplies,
  "brushes": artSupplies,
  "watercolor": artSupplies,
  "crayons": artSupplies,
  "drawing": artSupplies,
  
  // Science Lab Equipment
  "science lab": scienceLab,
  "lab": scienceLab,
  "laboratory": scienceLab,
  "lab equipment": scienceLab,
  "microscope": scienceLab,
  "beaker": scienceLab,
  "beakers": scienceLab,
  "test tube": scienceLab,
  "test tubes": scienceLab,
  "chemistry": scienceLab,
  "biology": scienceLab,
  "physics": scienceLab,
  
  // Backpacks
  "backpack": schoolBackpacks,
  "backpacks": schoolBackpacks,
  "school bag": schoolBackpacks,
  "school bags": schoolBackpacks,
  "bag": schoolBackpacks,
  "bags": schoolBackpacks,
};

// Category fallback images
const categoryImageMap: Record<string, string> = {
  "sanitary_pads": sanitaryPadsGeneric,
  "books": textbooks,
  "uniforms": schoolUniformSet,
  "meals": schoolMeals,
  "music": musicInstruments,
  "stationery": stationery,
  "technology": laptopsTablets,
  "sports": sportsEquipment,
  "furniture": desksChairs,
  "art": artSupplies,
  "science": scienceLab,
  "backpacks": schoolBackpacks,
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

  // Prefer more specific (longer) matches first to avoid collisions like "science" vs "science lab"
  const sortedEntries = Object.entries(productImageMap).sort(
    ([a], [b]) => b.length - a.length
  );

  // Check for exact or partial matches in product name
  for (const [key, image] of sortedEntries) {
    if (normalizedName.includes(key)) {
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
  textbooks,
  libraryBooks,
  laptopsTablets,
  schoolUniformSet,
  schoolMeals,
  sportsEquipment,
  desksChairs,
  artSupplies,
  scienceLab,
  schoolBackpacks,
};
