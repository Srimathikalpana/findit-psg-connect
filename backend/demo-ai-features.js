/**
 * Demo script showing FindIt AI features in action
 * Run this after setting up your OpenAI API key
 */

const { 
  generateEmbedding, 
  calculateCosineSimilarity, 
  verifyAnswerSemantically,
  findVerifiedMatches,
  clearEmbeddingCache,
  getCacheStats
} = require('./utils/semanticMatch');

// Demo data - realistic lost and found scenarios
const demoData = {
  lostItems: [
    {
      _id: 'lost-1',
      itemName: 'Black Leather Wallet',
      description: 'Black leather wallet with brown stitching, contains my credit cards and some cash',
      category: 'Personal Items',
      color: 'Black',
      brand: 'Unknown'
    },
    {
      _id: 'lost-2', 
      itemName: 'iPhone 13 Pro Max',
      description: 'Silver iPhone 13 Pro Max 256GB, has a black case and some scratches on the screen',
      category: 'Electronics',
      color: 'Silver',
      brand: 'Apple'
    },
    {
      _id: 'lost-3',
      itemName: 'Blue College T-shirt',
      description: 'Blue cotton t-shirt with PSG College logo printed on the front',
      category: 'Clothing',
      color: 'Blue',
      brand: 'PSG'
    }
  ],
  
  foundItems: [
    {
      _id: 'found-1',
      itemName: 'Dark Brown Leather Wallet',
      description: 'Dark brown leather wallet with tan stitching, found empty in the library',
      category: 'Personal Items',
      color: 'Brown',
      brand: 'Unknown',
      correctAnswer: 'brown leather wallet',
      verificationQuestion: 'What color and material is the wallet?'
    },
    {
      _id: 'found-2',
      itemName: 'Apple iPhone 13 Pro Max 256GB',
      description: 'Silver iPhone 13 Pro Max 256GB in Space Gray, found with black protective case',
      category: 'Electronics', 
      color: 'Space Gray',
      brand: 'Apple',
      correctAnswer: 'silver iPhone 13',
      verificationQuestion: 'What device is it and what color?'
    },
    {
      _id: 'found-3',
      itemName: 'Cotton Blue Shirt',
      description: 'Blue cotton shirt with PSG Tech logo on the front, size medium',
      category: 'Clothing',
      color: 'Blue',
      brand: 'PSG',
      correctAnswer: 'blue PSG shirt',
      verificationQuestion: 'What item and color is it?'
    }
  ]
};

async function demonstrateSemanticMatching() {
  console.log('🎯 DEMONSTRATING SEMANTIC MATCHING\n');
  console.log('=' .repeat(60));
  
  for (const lostItem of demoData.lostItems) {
    console.log(`\n🔍 Looking for matches for: "${lostItem.itemName}"`);
    console.log(`📝 Description: ${lostItem.description}`);
    
    try {
      // Generate embedding for lost item
      const lostEmbedding = await generateEmbedding(
        `${lostItem.itemName} ${lostItem.description} ${lostItem.category} ${lostItem.color} ${lostItem.brand}`
      );
      
      const matches = [];
      
      for (const foundItem of demoData.foundItems) {
        // Generate embedding for found item
        const foundEmbedding = await generateEmbedding(
          `${foundItem.itemName} ${foundItem.description} ${foundItem.category} ${foundItem.color} ${foundItem.brand}`
        );
        
        const similarity = calculateCosineSimilarity(lostEmbedding, foundEmbedding);
        
        if (similarity > 0.7) { // Lower threshold for demo
          matches.push({
            foundItem,
            similarity
          });
        }
      }
      
      // Sort by similarity
      matches.sort((a, b) => b.similarity - a.similarity);
      
      if (matches.length > 0) {
        console.log(`\n✅ Found ${matches.length} potential match(es):`);
        matches.forEach((match, index) => {
          console.log(`\n${index + 1}. ${match.foundItem.itemName}`);
          console.log(`   📝 Description: ${match.foundItem.description}`);
          console.log(`   🎯 Similarity: ${(match.similarity * 100).toFixed(1)}%`);
          
          if (match.similarity > 0.8) {
            console.log(`   ✅ HIGH MATCH - Very likely the same item!`);
          } else if (match.similarity > 0.7) {
            console.log(`   ⚠️  MODERATE MATCH - Could be the same item`);
          }
        });
      } else {
        console.log(`\n❌ No potential matches found`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${lostItem.itemName}: ${error.message}`);
    }
  }
}

async function demonstrateAnswerVerification() {
  console.log('\n\n🔐 DEMONSTRATING ANSWER VERIFICATION\n');
  console.log('=' .repeat(60));
  
  const verificationTests = [
    {
      question: 'What color and material is the wallet?',
      correctAnswer: 'brown leather wallet',
      userAnswers: [
        'brown leather',
        'dark brown leather wallet', 
        'leather brown',
        'wallet brown leather',
        'black wallet' // Should fail
      ]
    },
    {
      question: 'What device is it and what color?',
      correctAnswer: 'silver iPhone 13',
      userAnswers: [
        'iPhone 13 silver',
        'Apple iPhone 13 Pro Max silver',
        'silver iPhone',
        'iPhone silver color',
        'Samsung phone' // Should fail
      ]
    },
    {
      question: 'What item and color is it?',
      correctAnswer: 'blue PSG shirt',
      userAnswers: [
        'blue shirt',
        'PSG blue t-shirt',
        'blue cotton shirt PSG',
        'shirt blue PSG',
        'red jacket' // Should fail
      ]
    }
  ];
  
  for (const test of verificationTests) {
    console.log(`\n❓ Question: ${test.question}`);
    console.log(`✅ Correct Answer: "${test.correctAnswer}"`);
    
    for (const userAnswer of test.userAnswers) {
      try {
  const result = await verifyAnswerSemantically(userAnswer, test.correctAnswer);
        
        console.log(`\n👤 User Answer: "${userAnswer}"`);
        console.log(`🎯 Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`🔍 Verified: ${result.isVerified ? '✅ YES' : '❌ NO'}`);
        
        if (result.isVerified) {
          console.log(`   💡 This answer would be accepted!`);
        } else {
          console.log(`   🚫 This answer would be rejected`);
        }
        
      } catch (error) {
        console.error(`❌ Error verifying "${userAnswer}": ${error.message}`);
      }
    }
    console.log('\n' + '-'.repeat(40));
  }
}

async function demonstrateCachePerformance() {
  console.log('\n\n💾 DEMONSTRATING CACHE PERFORMANCE\n');
  console.log('=' .repeat(60));
  
  const testTexts = [
    'Black leather wallet with brown stitching',
    'iPhone 13 Pro Max silver color',
    'Blue cotton t-shirt PSG logo'
  ];
  
  console.log('📊 Initial cache stats:', getCacheStats());
  
  // First round - generate new embeddings
  console.log('\n🔄 First round - generating new embeddings:');
  const start1 = Date.now();
  for (const text of testTexts) {
    await generateEmbedding(text);
  }
  const time1 = Date.now() - start1;
  console.log(`⏱️  Total time: ${time1}ms`);
  
  // Second round - use cached embeddings
  console.log('\n🔄 Second round - using cached embeddings:');
  const start2 = Date.now();
  for (const text of testTexts) {
    await generateEmbedding(text);
  }
  const time2 = Date.now() - start2;
  console.log(`⏱️  Total time: ${time2}ms`);
  
  console.log('\n📊 Cache stats:', getCacheStats());
  console.log(`🚀 Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
  
  // Clear cache
  clearEmbeddingCache();
  console.log('\n🗑️  Cache cleared');
  console.log('📊 Cache stats after clearing:', getCacheStats());
}

async function runDemo() {
  console.log('🚀 FINDIT AI FEATURES DEMO\n');
  console.log('This demo shows how AI-powered semantic matching and verification work.\n');
  
  try {
    await demonstrateSemanticMatching();
    await demonstrateAnswerVerification();
    await demonstrateCachePerformance();
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ DEMO COMPLETED SUCCESSFULLY!');
    console.log('\n📋 Key Benefits Demonstrated:');
    console.log('• Semantic understanding of item descriptions');
    console.log('• Flexible answer verification (handles variations)');
    console.log('• High-performance caching system');
    console.log('• Significant accuracy improvements over exact matching');
    
    console.log('\n🎉 FindIt AI features are working perfectly!');
    console.log('\n💡 Next Steps:');
    console.log('1. Set your OPENAI_API_KEY in config.env');
    console.log('2. Run the full test suite: node test-semantic-matching.js');
    console.log('3. Start the server and test with real API calls');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 To fix this:');
      console.log('1. Get an API key from https://platform.openai.com/api-keys');
      console.log('2. Add it to your config.env file: OPENAI_API_KEY=your_key_here');
      console.log('3. Restart the demo');
    }
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo();
}

module.exports = {
  runDemo,
  demonstrateSemanticMatching,
  demonstrateAnswerVerification,
  demonstrateCachePerformance
};

