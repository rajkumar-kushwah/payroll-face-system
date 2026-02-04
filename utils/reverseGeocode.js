import fetch from "node-fetch";

/* ================= REVERSE GEOCODE ================= */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Attendance-System" }
    });

    const data = await res.json();
    const a = data.address || {};

    return [
      a.building,
      a.road,
      a.suburb || a.neighbourhood,
      a.city || a.town || a.village,
      a.state
    ].filter(Boolean).join(", ")
    || data.display_name
    || "Office Area";

  } catch {
    return "Office Area";
  }
}
