export default async function getAddressFromLatLng(lat, lng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
  
      const data = await response.json();
  
      return {
        state: data.address.state || "",
        city: data.address.city || data.address.town || data.address.village || "",
        fullAddress: data.display_name || "",
      };
    } catch (error) {
      console.log("❌ Reverse geocoding failed:", error);
      return { state: "", city: "", fullAddress: "" };
    }
  }
  