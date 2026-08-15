import { useState, useEffect, useCallback } from 'react';
import { calculateHaversine } from '../services/api';

export const useGeolocation = (officeCoords = { latitude: 12.971598, longitude: 77.594566, radiusMeters: 200 }) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState(false);

  const calculateDistanceAndStatus = useCallback((lat, lng) => {
    if (lat === null || lng === null || !officeCoords.latitude || !officeCoords.longitude) {
      return;
    }
    const dist = calculateHaversine(lat, lng, officeCoords.latitude, officeCoords.longitude);
    setDistanceMeters(dist);
    setIsInsideGeofence(dist <= (officeCoords.radiusMeters || 200));
  }, [officeCoords]);

  const refreshLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      // Fallback to default office location for demonstration
      const fallbackLat = officeCoords.latitude || 12.971598;
      const fallbackLng = officeCoords.longitude || 77.594566;
      setLocation({
        latitude: fallbackLat,
        longitude: fallbackLng,
        accuracy: 10,
        timestamp: Date.now(),
      });
      calculateDistanceAndStatus(fallbackLat, fallbackLng);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        setLocation({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          timestamp: position.timestamp,
        });

        calculateDistanceAndStatus(lat, lng);
        setLoading(false);
      },
      (err) => {
        console.warn('Geolocation acquisition warning:', err.message);
        setError(err.message || 'Unable to retrieve location');
        // Graceful fallback to simulated office coordinates for demo purposes if blocked/denied
        const demoLat = officeCoords.latitude || 12.971598;
        const demoLng = officeCoords.longitude || 77.594566;
        setLocation({
          latitude: demoLat,
          longitude: demoLng,
          accuracy: 15,
          timestamp: Date.now(),
        });
        calculateDistanceAndStatus(demoLat, demoLng);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [officeCoords, calculateDistanceAndStatus]);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  // Debug/Test feature: Force set location to test inside vs outside geofence
  const setSimulatedLocation = (lat, lng) => {
    setLocation({
      latitude: lat,
      longitude: lng,
      accuracy: 5,
      timestamp: Date.now()
    });
    calculateDistanceAndStatus(lat, lng);
  };

  return {
    location,
    loading,
    error,
    distanceMeters,
    isInsideGeofence,
    refreshLocation,
    setSimulatedLocation
  };
};
