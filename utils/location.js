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
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // must be set
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "OK") {
    return data.results[0].formatted_address; // gives building, street, landmarks
  } else {
    return "Unknown location";
  }
}