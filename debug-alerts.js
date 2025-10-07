// Debug script to check alerts API
// Run this in browser console on your dashboard page

async function debugAlerts() {
  console.log("🔍 Debugging alerts...")
  
  // 1. Check if we can get current location
  if (!navigator.geolocation) {
    console.error("❌ Geolocation not supported")
    return
  }
  
  // 2. Get location and test API
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude
    const lng = position.coords.longitude
    console.log(`📍 Current location: ${lat}, ${lng}`)
    
    // 3. Test alerts API
    try {
      const url = `/api/alerts?lat=${lat}&lng=${lng}&radius=250`
      console.log(`🌐 Testing API: ${url}`)
      
      const response = await fetch(url)
      const data = await response.json()
      
      console.log("📊 API Response:", data)
      console.log(`📈 Found ${data.alerts?.length || 0} alerts`)
      
      if (data.alerts?.length > 0) {
        console.log("✅ Alerts found:", data.alerts)
      } else {
        console.log("⚠️ No alerts found - database might be empty")
        
        // 4. Try to create sample alerts
        console.log("🔧 Creating sample alerts...")
        const seedResponse = await fetch("/api/alerts/seed", { method: "POST" })
        const seedData = await seedResponse.json()
        console.log("🌱 Seed result:", seedData)
        
        if (seedResponse.ok) {
          console.log("✅ Sample alerts created! Refresh the page.")
        }
      }
    } catch (error) {
      console.error("❌ API Error:", error)
    }
  }, (error) => {
    console.error("❌ Location Error:", error)
    console.log("🔧 Trying with default location...")
    
    // Use default location (Kothamangalam, Kerala)
    const defaultLat = 10.068
    const defaultLng = 76.628
    
    const url = `/api/alerts?lat=${defaultLat}&lng=${defaultLng}&radius=250`
    fetch(url)
      .then(r => r.json())
      .then(data => console.log("📊 Default location API Response:", data))
      .catch(e => console.error("❌ Default location API Error:", e))
  })
}

// Run the debug function
debugAlerts()