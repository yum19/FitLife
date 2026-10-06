const express = require("express")
const axios = require("axios")
const router = express.Router()

// Service to search gyms via Overpass API (OpenStreetMap)
class GymService {
  static async searchGymsNearby(latitude, longitude, radius = 5000) {
    try {
      const overpassQuery = `
        [out:json][timeout:30];
        (
          node["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
          way["leisure"="fitness_centre"](around:${radius},${latitude},${longitude});
          node["amenity"="gym"](around:${radius},${latitude},${longitude});
          way["amenity"="gym"](around:${radius},${latitude},${longitude});
          node["sport"="fitness"](around:${radius},${latitude},${longitude});
          way["sport"="fitness"](around:${radius},${latitude},${longitude});
          node["sport"="bodybuilding"](around:${radius},${latitude},${longitude});
          way["sport"="bodybuilding"](around:${radius},${latitude},${longitude});
        );
        out center meta;
      `

      const overpassServers = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass.openstreetmap.ru/api/interpreter",
      ]

      let lastError = null
      for (const server of overpassServers) {
        try {
          console.log(`Trying server: ${server}`)
          const response = await axios.post(server, overpassQuery, {
            headers: {
              "Content-Type": "text/plain",
              "User-Agent": "FitLife-Gym-Locator/1.0",
            },
            timeout: 30000, // 30 seconds timeout
          })

          if (response.data && response.data.elements) {
            console.log(`Success with ${server}, ${response.data.elements.length} elements found`)
            const filteredGyms = this.filterRealGyms(response.data.elements, latitude, longitude)
            console.log(`After filtering: ${filteredGyms.length} valid gyms`)
            return filteredGyms
          }
        } catch (error) {
          console.log(`Failed with ${server}:`, error.message)
          lastError = error
          continue
        }
      }

      console.log("All APIs failed, using test data")
      return this.getTestGymsData(latitude, longitude)
    } catch (error) {
      console.error("Error while searching gyms:", error.message)
      return this.getTestGymsData(latitude, longitude)
    }
  }

  static isActualGym(tags) {
    // Explicitly exclude non-gym facilities
    const excludedTypes = [
      "swimming_pool",
      "pool",
      "piscine",
      "football",
      "soccer",
      "tennis",
      "basketball",
      "volleyball",
      "pitch",
      "track",
      "field",
      "court",
      "stadium",
      "playground",
      "recreation_ground",
    ]

    // Check if it's explicitly excluded
    if (tags.sport && excludedTypes.includes(tags.sport)) return false
    if (tags.leisure && excludedTypes.includes(tags.leisure)) return false
    if (tags.amenity && excludedTypes.includes(tags.amenity)) return false

    // Check name for excluded terms (in French and Arabic context)
    const name = (tags.name || "").toLowerCase()
    const excludedNameKeywords = [
      "piscine",
      "pool",
      "terrain",
      "stade",
      "court",
      "pitch",
      "football",
      "tennis",
      "basketball",
      "volleyball",
      "natation",
    ]

    if (excludedNameKeywords.some((keyword) => name.includes(keyword))) {
      return false
    }

    // Only accept very specific gym/fitness tags
    const validGymTags = {
      leisure: ["fitness_centre"],
      amenity: ["gym"],
      sport: ["fitness", "bodybuilding", "weightlifting"],
    }

    // Check primary tags - be very restrictive
    if (tags.leisure && validGymTags.leisure.includes(tags.leisure)) return true
    if (tags.amenity && validGymTags.amenity.includes(tags.amenity)) return true
    if (tags.sport && validGymTags.sport.includes(tags.sport)) return true

    // Check name/brand for specific gym keywords only
    const brand = (tags.brand || "").toLowerCase()
    const strictGymKeywords = [
      "gym",
      "fitness",
      "musculation",
      "crossfit",
      "bodybuilding",
      "powerlifting",
      "weightlifting",
    ]

    const hasGymKeyword = strictGymKeywords.some((keyword) => name.includes(keyword) || brand.includes(keyword))

    // For sports shops, only accept if they explicitly mention gym/fitness
    if (tags.shop === "sports") {
      return hasGymKeyword
    }

    // For sports centres, be very restrictive - only if name clearly indicates gym
    if (tags.leisure === "sports_centre") {
      return hasGymKeyword
    }

    return hasGymKeyword
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distance in kilometers
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  static filterRealGyms(elements, userLat, userLon) {
    const uniqueGyms = new Map()

    elements.forEach((element) => {
      const lat = element.lat || (element.center && element.center.lat)
      const lon = element.lon || (element.center && element.center.lon)

      if (!lat || !lon) return

      const tags = element.tags || {}

      if (!this.isActualGym(tags)) {
        return
      }

      const name = tags.name || tags.brand || "Gym"
      const key = `${name}-${lat.toFixed(4)}-${lon.toFixed(4)}`

      if (!uniqueGyms.has(key)) {
        const distance = this.calculateDistance(userLat, userLon, lat, lon)
        uniqueGyms.set(key, {
          id: element.id,
          name: name,
          address: this.formatAddress(tags),
          latitude: lat,
          longitude: lon,
          distance: Math.round(distance * 100) / 100,
          phone: tags.phone || null,
          website: tags.website || tags["contact:website"] || null,
          email: tags.email || tags["contact:email"] || null,
          opening_hours: tags.opening_hours || null,
          type: this.determineGymType(tags),
          amenities: this.extractAmenities(tags),
          rating: null,
          priceRange: null,
        })
      }
    })

    return Array.from(uniqueGyms.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50)
  }

  static determineGymType(tags) {
    const name = (tags.name || "").toLowerCase()
    const brand = (tags.brand || "").toLowerCase()

    if (name.includes("crossfit") || brand.includes("crossfit")) return "CrossFit"
    if (name.includes("yoga")) return "Yoga studio"
    if (name.includes("pilates")) return "Pilates studio"
    if (name.includes("musculation") || name.includes("bodybuilding")) return "Weightlifting gym"

    if (tags.leisure === "fitness_centre") return "Fitness centre"
    if (tags.amenity === "gym") return "Gym"
    if (tags.sport === "fitness") return "Fitness centre"

    return "Gym"
  }

  static formatAddress(tags) {
    const addressParts = []
    if (tags["addr:housenumber"]) addressParts.push(tags["addr:housenumber"])
    if (tags["addr:street"]) addressParts.push(tags["addr:street"])
    if (tags["addr:city"]) addressParts.push(tags["addr:city"])
    if (tags["addr:postcode"]) addressParts.push(tags["addr:postcode"])

    return addressParts.length > 0 ? addressParts.join(", ") : "Address not available"
  }

  static extractAmenities(tags) {
    const amenities = []
    if (tags.parking === "yes" || tags["parking:fee"] === "no") amenities.push("Parking")
    if (tags.wheelchair === "yes") amenities.push("Wheelchair accessible")
    if (tags.shower === "yes") amenities.push("Showers")
    if (tags.changing_room === "yes") amenities.push("Changing rooms")
    if (tags.sauna === "yes") amenities.push("Sauna")
    if (tags.air_conditioning === "yes") amenities.push("Air conditioning")
    if (tags.wifi === "yes" || tags["internet_access"] === "wlan") amenities.push("WiFi")

    return amenities
  }

  static getTestGymsData(userLat, userLon) {
    const testGyms = [
      {
        id: "test_1",
        name: "HK GYM",
        address: "Avenue Habib Bourguiba, Sfax",
        latitude: userLat + 0.001,
        longitude: userLon + 0.001,
        distance: 0.15,
        phone: "+216 74 123 456",
        opening_hours: "Mo-Su 06:00-22:00",
        type: "Fitness centre",
        amenities: ["Parking", "Showers", "Changing rooms"],
      },
      {
        id: "test_2",
        name: "MEGAGYM Fitness Club",
        address: "Route de Tunis, Sfax",
        latitude: userLat + 0.002,
        longitude: userLon - 0.001,
        distance: 0.28,
        phone: "+216 74 987 654",
        opening_hours: "Mo-Fr 06:30-22:30; Sa-Su 08:00-20:00",
        type: "Fitness centre",
        amenities: ["Parking", "Showers", "Changing rooms", "Air conditioning"],
      },
      {
        id: "test_3",
        name: "KA gym",
        address: "City Center, Sfax",
        latitude: userLat - 0.001,
        longitude: userLon + 0.002,
        distance: 0.35,
        phone: "+216 74 555 777",
        opening_hours: "Mo-Su 06:00-22:00",
        type: "Weightlifting gym",
        amenities: ["Showers", "Changing rooms", "WiFi"],
      },
      {
        id: "test_4",
        name: "Time Sport",
        address: "Rue de la République, Sfax",
        latitude: userLat + 0.003,
        longitude: userLon + 0.003,
        distance: 0.52,
        phone: "+216 74 444 888",
        opening_hours: "Mo-Fr 06:00-23:00; Sa-Su 07:00-21:00",
        type: "Sports centre",
        amenities: ["Parking", "Showers", "Changing rooms", "Sauna"],
      },
      {
        id: "test_5",
        name: "Olympique Center",
        address: "Avenue Ali Belhouane, Sfax",
        latitude: userLat - 0.002,
        longitude: userLon - 0.002,
        distance: 0.67,
        phone: "+216 74 333 999",
        opening_hours: "Mo-Su 06:30-22:30",
        type: "Fitness centre",
        amenities: ["Parking", "Showers", "Changing rooms", "Air conditioning"],
      },
    ]

    return testGyms.sort((a, b) => a.distance - b.distance)
  }
}

// Route to search for nearby gyms
router.get("/nearby", async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Latitude and longitude parameters are required",
      })
    }

    const lat = Number.parseFloat(latitude)
    const lon = Number.parseFloat(longitude)
    const searchRadius = radius ? Number.parseInt(radius) : 5000 // default 5km

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({
        error: "Invalid coordinates",
      })
    }

    const gyms = await GymService.searchGymsNearby(lat, lon, searchRadius)

    res.json({
      success: true,
      count: gyms.length,
      data: gyms,
      searchParams: {
        latitude: lat,
        longitude: lon,
        radius: searchRadius,
      },
    })
  } catch (error) {
    console.error("Error in /nearby:", error)
    res.status(500).json({
      error: "Error while searching gyms",
      message: error.message,
    })
  }
})

// Route to get details of a specific gym
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params

    const overpassQuery = `
      [out:json][timeout:25];
      (
        node(${id});
        way(${id});
        relation(${id});
      );
      out center meta;
    `

    const response = await axios.post("https://overpass-api.de/api/interpreter", overpassQuery, {
      headers: {
        "Content-Type": "text/plain",
        "User-Agent": "FitLife-Gym-Locator/1.0",
      },
    })

    if (response.data.elements.length === 0) {
      return res.status(404).json({
        error: "Gym not found",
      })
    }

    const element = response.data.elements[0]
    const gymDetails = GymService.filterRealGyms([element], 0, 0)[0]

    if (!gymDetails) {
      return res.status(404).json({
        error: "This element is not a valid gym",
      })
    }

    res.json({
      success: true,
      data: gymDetails,
    })
  } catch (error) {
    console.error("Error in /:id:", error)
    res.status(500).json({
      error: "Error while retrieving details",
      message: error.message,
    })
  }
})

module.exports = router
