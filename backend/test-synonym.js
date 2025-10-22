const { lexicalSynonymSimilarity, getSynonymSet } = require('./utils/synonymService');

async function testPair(a, b) {
  const score = await lexicalSynonymSimilarity(a, b);
  const setA = await getSynonymSet(a.split(/\s+/)[0]);
  const setB = await getSynonymSet(b.split(/\s+/)[0]);
  console.log(`\nPair: "${a}" vs "${b}"`);
  console.log(`Score: ${score.toFixed(3)}`);
  console.log(`Synonyms A (sample): ${Array.from(setA).slice(0,8).join(', ')}`);
  console.log(`Synonyms B (sample): ${Array.from(setB).slice(0,8).join(', ')}`);
}

async function run() {
  console.log('Running synonym similarity tests...');
  // Useful pairs
  await testPair('wallet', 'purse');
  await testPair('cash', 'money');
  await testPair('phone', 'mobile');
  await testPair('backpack', 'bag');
  process.exit(0);
}

run().catch(e => { console.error('Test failed:', e); process.exit(1); });
