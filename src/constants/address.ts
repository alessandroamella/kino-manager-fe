import { isIOS } from 'react-device-detect';

export const address = 'Via Piave 3, 41018 San Cesario sul Panaro (MO)';

const mapsPlaceId = 'ChIJZ0GUuP7df0cRRk0kgyPU0Sw';
const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  'Kinó Café',
)}&destination_place_id=${mapsPlaceId}`;

const appleMapsDirectionsUrl = `https://maps.apple.com/?address=${encodeURIComponent(
  address,
)}`;

export const directionsUrl = isIOS
  ? appleMapsDirectionsUrl
  : googleMapsDirectionsUrl;
