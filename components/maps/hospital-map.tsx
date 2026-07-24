'use client';

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';

interface Props {
  latitude: number;
  longitude: number;
}

export function HospitalGoogleMap({ latitude, longitude }: Props) {
  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  if (isNaN(latNum) || isNaN(lngNum)) return null; // fallback if invalid

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  });

  if (!isLoaded) {
    return (<div className="h-[320px] flex items-center justify-center border rounded-xl">
      Loading Map... </div>
    );
  }

  return (<div className="h-[320px] rounded-xl overflow-hidden border">

    <GoogleMap
      center={{ lat: latNum, lng: lngNum }}
      zoom={15}
      mapContainerStyle={{ width: '100%', height: '100%' }}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
      }}
    >
      <Marker position={{ lat: latNum, lng: lngNum }} />
    </GoogleMap>

  </div>

  );
}
