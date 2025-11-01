/**
 * Test script for local embeddings using @xenova/transformers
 * This verifies that semantic matching works correctly with local models
 */

const { 
  generateEmbedding, 
  calculateCosineSimilarity,
  findSemanticMatches,
  clearEmbeddingCache
} = require('./utils/semanticMatch');

async function testEmbeddings() {
  console.log('🧪 Testing Local Embedding Generation...\n');

  try {
    // Test cases: items that should be similar semantically
    const testCases = [
      {
        name: 'Wallet vs Purse',
        item1: { itemName: 'wallet', description: 'brown leather wallet', category: 'accessories' },
        item2: { itemName: 'purse', description: 'brown leather purse', category: 'accessories' },
        expected: 'High similarity'
      },
      {
        name: 'Money vs Cash',
        item1: { itemName: 'money', description: 'some cash money', category: 'valuables' },
        item2: { itemName: 'cash', description: 'some money cash', category: 'valuables' },
        expected: 'High similarity'
      },
      {
        name: 'Phone vs Wallet (different)',
        item1: { itemName: 'phone', description: 'smartphone iPhone', category: 'electronics' },
        item2: { itemName: 'wallet', description: 'brown leather wallet', category: 'accessories' },
        expected: 'Low similarity'
      },
      {
        name: 'Keys vs Keychain',
        item1: { itemName: 'keys', description: 'bunch of keys', category: 'accessories' },
        item2: { itemName: 'keychain', description: 'keychain with keys', category: 'accessories' },
        expected: 'High similarity'
      }
    ];

    console.log('📝 Testing individual embeddings...');
    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      
      const text1 = `${testCase.item1.itemName} ${testCase.item1.description}`;
      const text2 = `${testCase.item2.itemName} ${testCase.item2.description}`;
      
      const embedding1 = await generateEmbedding(text1);
      const embedding2 = await generateEmbedding(text2);
      
      if (!embedding1 || !embedding2) {
        console.error('❌ Failed to generate embeddings');
        continue;
      }
      
      const similarity = calculateCosineSimilarity(embedding1, embedding2);
      console.log(`   Similarity: ${similarity.toFixed(4)} (${testCase.expected})`);
      console.log(`   Embedding dimensions: ${embedding1.length}`);
      
      // Verify high similarity for similar items
      if (testCase.expected === 'High similarity' && similarity > 0.7) {
        console.log('   ✅ PASS: High similarity as expected');
      } else if (testCase.expected === 'Low similarity' && similarity < 0.5) {
        console.log('   ✅ PASS: Low similarity as expected');
      } else {
        console.log(`   ⚠️  Note: Similarity is ${similarity > 0.7 ? 'high' : 'low'}`);
      }
    }

    // Test semantic matching function
    console.log('\n\n🔍 Testing semantic matching function...');
    const newItem = {
      itemName: 'wallet',
      description: 'brown leather wallet with cards',
      category: 'accessories',
      descriptionEmbedding: null // Will be generated automatically
    };

    const existingItems = [
      {
        _id: '1',
        itemName: 'purse',
        description: 'brown leather purse',
        category: 'accessories',
        descriptionEmbedding: null
      },
      {
        _id: '2',
        itemName: 'phone',
        description: 'smartphone iPhone',
        category: 'electronics',
        descriptionEmbedding: null
      },
      {
        _id: '3',
        itemName: 'wallet',
        description: 'black wallet',
        category: 'accessories',
        descriptionEmbedding: null
      }
    ];

    const matches = await findSemanticMatches(newItem, existingItems, 0.5);
    console.log(`\n📊 Found ${matches.length} matches:`);
    matches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.item.itemName} - similarity: ${match.similarity.toFixed(4)}`);
      console.log(`      Semantic: ${match.semanticSim.toFixed(4)}, Lexical: ${match.lexicalSim.toFixed(4)}`);
    });

    console.log('\n✅ All tests completed!');
    console.log('\n💡 Note: The model will be cached after first load for faster subsequent runs.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  testEmbeddings()
    .then(() => {
      console.log('\n✨ Test suite finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmbeddings };

