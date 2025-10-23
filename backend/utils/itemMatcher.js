const stringSimilarity = require('string-similarity');
const { lexicalSynonymSimilarity } = require('./synonymService');

async function calculateItemSimilarity(item1, item2) {
  // Combine relevant fields for comparison
  const text1 = `${item1.itemName} ${item1.description} ${item1.category || ''}`;
  const text2 = `${item2.itemName} ${item2.description} ${item2.category || ''}`;

  // Use synonym-aware lexical similarity (falls back to plain lexical similarity)
  try {
    return await lexicalSynonymSimilarity(text1, text2);
  } catch (e) {
    return stringSimilarity.compareTwoStrings(text1.toLowerCase(), text2.toLowerCase());
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

async function findMatches(newItem, existingItems) {
  const matches = [];
  
  for (const item of existingItems) {
  // Check item similarity
  const similarity = await calculateItemSimilarity(newItem, item);

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

    // Item must meet all criteria: similarity, location, and time
    if (similarity >= 0.8 && locationMatch && timeValid) {
      matches.push({
        itemId: item._id,
        similarity,
        locationMatch: true,
        timeValid: true
      });
    }
  }
  
  // Sort by similarity score
  return matches.sort((a, b) => b.similarity - a.similarity);
}

module.exports = { 
  findMatches,
  calculateItemSimilarity,
  isLocationNearby,
  isTimeValid
};
