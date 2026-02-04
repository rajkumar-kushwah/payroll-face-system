
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy // meters
        });
      },
      () => {
        reject("Location permission denied");
      },
      {
        enableHighAccuracy: true,   //  MUST
        timeout: 20000,
        maximumAge: 0
      }
    );
  });
}
