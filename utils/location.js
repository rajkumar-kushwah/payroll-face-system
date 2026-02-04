import fetch from "node-fetch";

// export async function reverseGeocode(lat, lng) {
//   const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

//   const res = await fetch(url, {
//     headers: {
//       "User-Agent": "Attendance-System"
//     }
//   });

//   const data = await res.json();
//   return data.display_name || "Unknown location";
// }


export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Attendance-System" },
      timeout: 5000 // optional timeout
    });

    if (!res.ok) {
      console.error("Reverse geocode failed:", res.statusText);
      return "Unknown location";
    }

    const data = await res.json();
    return data.display_name || "Unknown location";
  } catch (err) {
    console.error("Reverse geocode error:", err);
    return "Unknown location";
  }
}
