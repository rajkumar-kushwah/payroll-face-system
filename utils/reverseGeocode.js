import fetch from "node-fetch";

/* ================= REVERSE GEOCODE ================= */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Attendance-System"
      }
    });

    const data = await res.json();
    const a = data.address || {};

    //  Best fallback order
    const address = [
      a.building,
      a.road,
      a.suburb,
      a.village,
      a.city || a.town,
      a.state
    ].filter(Boolean).join(", ");

    return address || "Office Area";
  } catch (err) {
    return "Office Area";
  }
}
