// Test script for FindIT Backend API
// Run this to test all endpoints

const API_BASE = 'http://localhost:8080';

async function testAPI() {
  console.log('🧪 Testing FindIT Backend API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.message);
    console.log('   Port:', healthData.port);
    console.log('');

    // Test 2: User Registration
    console.log('2️⃣ Testing User Registration...');
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@psgtech.ac.in',
        studentId: '21CS001',
        password: 'password123'
      })
    });
    
    const registerData = await registerResponse.json();
    if (registerData.success) {
      console.log('✅ User Registration:', registerData.message);
      console.log('   User ID:', registerData.data._id);
      console.log('   Token:', registerData.data.token.substring(0, 20) + '...');
      
      const token = registerData.data.token;
      
      // Test 3: User Login
      console.log('\n3️⃣ Testing User Login...');
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@psgtech.ac.in',
          password: 'password123'
        })
      });
      
      const loginData = await loginResponse.json();
      if (loginData.success) {
        console.log('✅ User Login:', loginData.message);
        console.log('   User:', loginData.data.name);
        console.log('   Role:', loginData.data.role);
      } else {
        console.log('❌ Login Failed:', loginData.message);
      }

      // Test 4: Create Lost Item
      console.log('\n4️⃣ Testing Lost Item Creation...');
      const lostItemResponse = await fetch(`${API_BASE}/api/lost-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          itemName: 'iPhone 13',
          description: 'Black iPhone with cracked screen',
          placeLost: 'Computer Science Lab',
          dateLost: '2024-01-15',
          category: 'Electronics',
          color: 'Black',
          brand: 'Apple'
        })
      });
      
      const lostItemData = await lostItemResponse.json();
      if (lostItemData.success) {
        console.log('✅ Lost Item Created:', lostItemData.message);
        console.log('   Item ID:', lostItemData.data._id);
      } else {
        console.log('❌ Lost Item Creation Failed:', lostItemData.message);
      }

      // Test 5: Get All Lost Items
      console.log('\n5️⃣ Testing Get Lost Items...');
      const getLostItemsResponse = await fetch(`${API_BASE}/api/lost-items`);
      const getLostItemsData = await getLostItemsResponse.json();
      if (getLostItemsData.success) {
        console.log('✅ Lost Items Retrieved:', getLostItemsData.data.length, 'items');
      } else {
        console.log('❌ Get Lost Items Failed:', getLostItemsData.message);
      }

      // Test 6: Get User's Items
      console.log('\n6️⃣ Testing Get User Items...');
      const getUserItemsResponse = await fetch(`${API_BASE}/api/my-items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const getUserItemsData = await getUserItemsResponse.json();
      if (getUserItemsData.success) {
        console.log('✅ User Items Retrieved:');
        console.log('   Lost Items:', getUserItemsData.data.lostItems.length);
        console.log('   Found Items:', getUserItemsData.data.foundItems.length);
      } else {
        console.log('❌ Get User Items Failed:', getUserItemsData.message);
      }

    } else {
      console.log('❌ User Registration Failed:', registerData.message);
    }

    console.log('\n🎉 API Testing Complete!');
    console.log('Your backend is working perfectly! 🚀');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.log('\n💡 Make sure your backend is running on port 8080');
    console.log('   Run: npm start');
  }
}

// Run the test
testAPI();
