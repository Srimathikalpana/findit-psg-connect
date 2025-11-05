const stringSimilarity = require('string-similarity');
const { lexicalSynonymSimilarity } = require('./synonymService');
const { compareItemNameAndDescription } = require('./textSimilarity');

/**
 * Calculate item similarity using Xenova transformers on itemName + description only
 * @param {Object} item1 - First item
 * @param {Object} item2 - Second item
 * @returns {Promise<number>} - Similarity score (0-1 scale)
 */
async function calculateItemSimilarity(item1, item2) {
  try {
    // Use Xenova to compare only itemName and description
    const similarityPercent = await compareItemNameAndDescription(item1, item2);
    
    // Convert from 0-100 scale to 0-1 scale for compatibility with itemMatcher
    const similarity = similarityPercent / 100;
    
    return similarity;
  } catch (error) {
    console.error('Error calculating item similarity with Xenova:', error);
    // Fallback to lexical similarity if Xenova fails
    const text1 = `${item1.itemName || ''} ${item1.description || ''}`.trim();
    const text2 = `${item2.itemName || ''} ${item2.description || ''}`.trim();
    
    if (!text1 || !text2) {
      return 0;
    }
    
    try {
      return await lexicalSynonymSimilarity(text1, text2);
    } catch (e) {
      return stringSimilarity.compareTwoStrings(text1.toLowerCase(), text2.toLowerCase());
    }
  }
}

function isLocationNearby(location1, location2) {
  // Define nearby locations map (areas that are considered close to each other)
  const nearbyLocations = {
    'Library': ['Library', 'Academic Block A', 'Academic Block B'],
    'Cafeteria': ['Cafeteria', 'Main Building', 'Sports Complex'],
    'Academic Block A': ['Library', 'Academic Block A', 'Academic Block B'],
    'Academic Block B': ['Library', 'Academic Block A', 'Academic Block B'],
    'Academic Block C': ['Academic Block C', 'Parking Area'],
    'Sports Complex': ['Sports Complex', 'Cafeteria', 'Parking Area'],
    'Auditorium': ['Auditorium', 'Main Building'],
    'Parking Area': ['Parking Area', 'Sports Complex', 'Academic Block C'],
    'Computer Center': ['Computer Center', 'Academic Block A'],
    'Hostel': ['Hostel']
  };

  // Check if locations are the same or nearby
  return location1 === location2 || 
         (nearbyLocations[location1] && nearbyLocations[location1].includes(location2));
}

function isTimeValid(lostTime, foundTime) {
  // Convert dates to timestamps
  const lostDate = new Date(lostTime).getTime();
  const foundDate = new Date(foundTime).getTime();

  // Found time should be after lost time
  return foundDate >= lostDate;
}

/**
 * Find matches using Xenova similarity (itemName + description) and itemMatcher conditions
 * @param {Object} newItem - The new item to match
 * @param {Array} existingItems - Array of existing items to match against
 * @param {number} minSimilarity - Minimum similarity threshold (0-1 scale, default 0.7)
 * @returns {Promise<Array>} - Array of matches that satisfy all conditions
 */
async function findMatches(newItem, existingItems, minSimilarity = 0.7) {
  const matches = [];
  const newItemName = newItem.itemName || 'Unknown';
  
  console.log(`[findMatches] Comparing "${newItemName}" against ${existingItems.length} items (min similarity: ${minSimilarity})`);
  
  for (const item of existingItems) {
    try {
      const existingItemName = item.itemName || 'Unknown';
      
      // Calculate similarity using Xenova (itemName + description only)
      const similarity = await calculateItemSimilarity(newItem, item);
      const similarityPercent = Math.round(similarity * 100);

      // Get locations based on item type
      const newItemLocation = newItem.placeLost || newItem.placeFound;
      const existingItemLocation = item.placeLost || item.placeFound;

      // Get times based on item type
      const isLostItem = !!newItem.dateLost;
      const lostTime = isLostItem ? newItem.dateLost : item.dateLost;
      const foundTime = isLostItem ? item.dateFound : newItem.dateFound;

      // Check if locations are nearby and times are valid
      const locationMatch = isLocationNearby(newItemLocation, existingItemLocation);
      const timeValid = isTimeValid(lostTime, foundTime);

      // Log detailed matching information for debugging
      console.log(`[findMatches] "${newItemName}" vs "${existingItemName}":`);
      console.log(`  - Similarity: ${similarityPercent}% (required: ≥${Math.round(minSimilarity * 100)}%)`);
      console.log(`  - Location: "${newItemLocation}" vs "${existingItemLocation}" → ${locationMatch ? '✓ Match' : '✗ No match'}`);
      console.log(`  - Time: Lost ${lostTime} → Found ${foundTime} → ${timeValid ? '✓ Valid' : '✗ Invalid (found before lost)'}`);

      // Item must meet ALL criteria: similarity >= threshold, location match, and time valid
      if (similarity >= minSimilarity && locationMatch && timeValid) {
        console.log(`  → ✓ MATCH FOUND!`);
        matches.push({
          itemId: item._id,
          similarity,
          similarityPercent,
          locationMatch: true,
          timeValid: true
        });
      } else {
        const reasons = [];
        if (similarity < minSimilarity) reasons.push(`similarity ${similarityPercent}% < ${Math.round(minSimilarity * 100)}%`);
        if (!locationMatch) reasons.push('location mismatch');
        if (!timeValid) reasons.push('time invalid');
        console.log(`  → ✗ No match (${reasons.join(', ')})`);
      }
    } catch (error) {
      console.error(`[findMatches] Error matching item ${item._id}:`, error.message);
      // Skip this item if matching fails
    }
  }
  
  // Sort by similarity score (descending)
  const sortedMatches = matches.sort((a, b) => b.similarity - a.similarity);
  console.log(`[findMatches] Total matches found: ${sortedMatches.length}`);
  
  return sortedMatches;
}

module.exports = { 
  findMatches,
  calculateItemSimilarity,
  isLocationNearby,
  isTimeValid
};
