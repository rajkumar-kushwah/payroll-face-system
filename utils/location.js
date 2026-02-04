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
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Attendance-System" }
  });

  const data = await res.json();

  return (
    data.address?.building ||
    data.address?.road ||
    data.display_name ||
    "Unknown location"
  );
}
