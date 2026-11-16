export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracy_m: number;
};

export function getDeviceLocation(): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser does not support location access."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy_m: position.coords.accuracy,
        });
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Allow location access to clock in.",
          2: "Your location is currently unavailable. Try again.",
          3: "Location request timed out. Please try again.",
        };

        reject(
          new Error(
            messages[error.code] ??
              "Unable to get your location. Please try again.",
          ),
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  });
}