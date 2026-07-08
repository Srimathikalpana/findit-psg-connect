/**
 * Script to clean up low-quality matches from the database
 * Run this with: node scripts/cleanup-matches.js
 */

require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const LostItem = require('../models/lostItem');
const FoundItem = require('../models/foundItem');
const { compareTextAndImage } = require('../controllers/compareController');

async function cleanupLowQualityMatches() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧹 Starting cleanup of low-quality matches...');
    const MIN_SIMILARITY = 70; // 70% threshold
    let cleanedLostItems = 0;
    let totalRemovedMatches = 0;
    let totalCheckedMatches = 0;

    // Clean up lost items
    const lostItems = await LostItem.find({ 
      status: 'active',
      potentialMatches: { $exists: true, $ne: [] }
    });

    console.log(`📊 Found ${lostItems.length} lost items with potential matches to check\n`);

    for (let i = 0; i < lostItems.length; i++) {
      const lostItem = lostItems[i];
      if (!lostItem.potentialMatches || lostItem.potentialMatches.length === 0) continue;

      console.log(`\n[${i + 1}/${lostItems.length}] Checking: "${lostItem.itemName}"`);
      console.log(`   Current matches: ${lostItem.potentialMatches.length}`);

      const validMatches = [];
      let removedFromThisItem = 0;
      
      for (const matchId of lostItem.potentialMatches) {
        try {
          totalCheckedMatches++;
          const foundItem = await FoundItem.findById(matchId);
          
          if (!foundItem || foundItem.status !== 'active') {
            console.log(`   ❌ Removed: Found item not found or inactive`);
            removedFromThisItem++;
            totalRemovedMatches++;
            continue;
          }

          // Calculate accurate similarity
          const comparisonResult = await compareTextAndImage(lostItem, foundItem);
          
          // Only keep matches with ≥70% similarity
          if (comparisonResult.score >= MIN_SIMILARITY) {
            validMatches.push(matchId);
            console.log(`   ✅ Kept: "${foundItem.itemName}" (${comparisonResult.score}%)`);
          } else {
            console.log(`   ❌ Removed: "${foundItem.itemName}" (${comparisonResult.score}% - below threshold)`);
            removedFromThisItem++;
            totalRemovedMatches++;
          }
        } catch (e) {
          console.warn(`   ⚠️  Error checking match: ${e.message}`);
          // Keep the match if we can't verify it (to be safe)
          validMatches.push(matchId);
        }
      }

      // Update if matches were removed
      if (validMatches.length !== lostItem.potentialMatches.length) {
        lostItem.potentialMatches = validMatches;
        await lostItem.save();
        cleanedLostItems++;
        console.log(`   📝 Updated: Removed ${removedFromThisItem} low-quality match(es)`);
      } else {
        console.log(`   ✓ All matches are high-quality`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Cleanup Complete!');
    console.log('='.repeat(60));
    console.log(`📊 Statistics:`);
    console.log(`   - Lost items cleaned: ${cleanedLostItems}`);
    console.log(`   - Total matches checked: ${totalCheckedMatches}`);
    console.log(`   - Low-quality matches removed: ${totalRemovedMatches}`);
    console.log(`   - Remaining high-quality matches: ${totalCheckedMatches - totalRemovedMatches}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the cleanup
cleanupLowQualityMatches();

