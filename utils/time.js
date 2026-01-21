// utils/time.js

/**
 * Convert "HH:mm" string -> Date object of given day (dateStr: "YYYY-MM-DD")
 */
export const hhmmToDate = (dateStr, hhmm) => {
  if (!hhmm) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = hhmm.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0); // Local time
};


/**
 * Minutes difference between two Date objects
 * Ensures non-negative
 */
export const minutesBetween = (start, end) => {
  if (!start || !end) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
};

/**
 * Convert minutes → decimal hours (e.g., 510 → 8.5)
 */
export const minutesToHoursDecimal = (mins) => {
  if (!mins || mins <= 0) return 0;
  return +(mins / 60).toFixed(2);
};

/**
 * Format Date object → "HH:mm" string
 */
/**
 * Format Date object → "h:mm AM/PM" string
 */
// export const formatTime12H = (date) => {
//   if (!date) return "-";
//   const d = new Date(date);
//   let hours = d.getHours();
//   const minutes = d.getMinutes().toString().padStart(2, "0");
//   const ampm = hours >= 12 ? "PM" : "AM";
//   hours = hours % 12;
//   if (hours === 0) hours = 12;
//   return `${hours}:${minutes} ${ampm}`;
// };

export const formatTime12H = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatTimeIST = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// export const hhmmToDateUTC = (date, hhmm) => {
//   if (!hhmm) return null;
//   const [hours, minutes] = hhmm.split(":").map(Number);
//   const d = new Date(date);
//   d.setUTCHours(hours, minutes, 0, 0); // UTC-safe
//   return d;
// };

export const hhmmToDateUTC = (date, hhmm) => {
  if (!hhmm) return null;

  const [h, m] = hhmm.split(":").map(Number);

  // date is YYYY-MM-DD
  const d = new Date(`${date}T00:00:00.000Z`);

  // IST → UTC
  d.setUTCHours(h - 5, m - 30, 0, 0);

  return d;
};



/**
 * Format Date object → "YYYY-MM-DD" string
 */
export const formatDateYYYYMMDD = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};


const formatTime = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export { formatTime };