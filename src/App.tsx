import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./config/firebase";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const mapCenter = {
  lat: 28.70406,
  lng: 77.102493,
};

function App() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_MAP_API_KEY,
  });
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef: any = collection(db, "numberedQuestMarkers");

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    const center: google.maps.LatLngLiteral = mapCenter;
    const bounds = new window.google.maps.LatLngBounds(center);

    setMap(map);
  }, []);

  const getMarkersHandler = async () => {
    try {
      const res = await getDocs(markersRef);
      const markersData = res.docs.map((doc: any) => ({
        ...doc.data(),
        id: doc.id,
      }));
      if (markersData.length > 0) {
        const data = markersData.map((marker, index) => {
          const latlng = marker?.location?.split(",");
          const newMarker = new google.maps.Marker({
            position: {
              lat: parseFloat(latlng[0]),
              lng: parseFloat(latlng[1]),
            },
            label: {
              text: JSON.stringify(index + 1),
              color: "#000000",
              fontSize: "14px",
              fontWeight: "bold",
            },
            map: map,
          });
          return newMarker;
        });
        setMarkers(data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onLoadMarker = (marker: google.maps.Marker) => {
    setMarkers((current) => [...current, marker]);
  };

  const onMapClick = async (event: google.maps.MapMouseEvent) => {
    const newMarker = new google.maps.Marker({
      position: event.latLng,
      label: {
        text: JSON.stringify(markers.length + 1),
        color: "#000000",
        fontSize: "14px",
        fontWeight: "bold",
      },
      map: map,
    });
    try {
      await addDoc(markersRef, {
        location: event?.latLng?.lat() + "," + event?.latLng?.lng(),
        timeStamp: Date.now(),
      });
      getMarkersHandler();
    } catch (error) {
      console.log(error);
    }
    onLoadMarker(newMarker);
  };
  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  useEffect(() => {
    getMarkersHandler();
  }, []);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={onMapClick}
    >
      {markers.length > 0 &&
        markers.map((marker, index) => (
          <Marker
            key={index}
            position={
              marker.getPosition() as unknown as google.maps.LatLngLiteral
            }
            label={marker.getLabel() as unknown as google.maps.MarkerLabel}
          />
        ))}
    </GoogleMap>
  ) : (
    <></>
  );
}

export default React.memo(App);
