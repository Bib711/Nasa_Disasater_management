// Test validation script - run this in browser console to test report validation

async function testReportValidation() {
  console.log("Testing report validation...");
  
  // Test 1: Valid report
  try {
    const validReport = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'flood',
        details: 'Test flood report with detailed description',
        location: {
          type: 'Point',
          coordinates: [76.6280, 10.0680]
        }
      })
    });
    const validResult = await validReport.json();
    console.log("✅ Valid report test:", validResult);
  } catch (error) {
    console.log("❌ Valid report test failed:", error);
  }
  
  // Test 2: Missing type
  try {
    const noType = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        details: 'Test description',
        location: { type: 'Point', coordinates: [76.6280, 10.0680] }
      })
    });
    const noTypeResult = await noType.json();
    console.log("🔍 No type test:", noTypeResult);
  } catch (error) {
    console.log("❌ No type test failed:", error);
  }
  
  // Test 3: Short description
  try {
    const shortDesc = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'fire',
        details: 'Short',
        location: { type: 'Point', coordinates: [76.6280, 10.0680] }
      })
    });
    const shortDescResult = await shortDesc.json();
    console.log("🔍 Short description test:", shortDescResult);
  } catch (error) {
    console.log("❌ Short description test failed:", error);
  }
  
  // Test 4: Invalid coordinates
  try {
    const invalidCoords = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'earthquake',
        details: 'Test earthquake report with detailed description',
        location: { type: 'Point', coordinates: [999, 999] }
      })
    });
    const invalidCoordsResult = await invalidCoords.json();
    console.log("🔍 Invalid coordinates test:", invalidCoordsResult);
  } catch (error) {
    console.log("❌ Invalid coordinates test failed:", error);
  }
  
  console.log("Report validation tests completed!");
}

// Run the test
testReportValidation();