/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations);

function addControlPlaceholders(map) {
  var corners = map._controlCorners,
    l = 'leaflet-',
    container = map._controlContainer;

  function createCorner(vSide, hSide) {
    var className = l + vSide + ' ' + l + hSide;

    corners[vSide + hSide] = L.DomUtil.create('div', className, container);
  }

  createCorner('verticalcenter', 'left');
  createCorner('verticalcenter', 'right');
}

// ----------------------------------------------
// Create the map and attach it to the #map
// ----------------------------------------------

const map = L.map('map', { zoomDelta: 1, zoomSnap: 0 });

addControlPlaceholders(map);

// Change the position of the Zoom Control to a newly created placeholder.
map.zoomControl.setPosition('verticalcenterleft');

// You can also put other controls in the same placeholder.
L.control.scale({ position: 'verticalcenterleft' }).addTo(map);

// ----------------------------------------------
// Add a tile layer to add to our map
// ----------------------------------------------

L.tileLayer(
  'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.{ext}',
  {
    minZoom: 0,
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png',
  },
).addTo(map);

// ----------------------------------------------
// Create icon using the image provided by Jonas
// ----------------------------------------------

var greenIcon = L.icon({
  iconUrl: '/img/pin.png',
  iconSize: [32, 40], // size of the icon
  iconAnchor: [16, 45], // point of the icon which will correspond to marker's location
  popupAnchor: [0, -50], // point from which the popup should open relative to the iconAnchor
});

// ----------------------------------------------
// Add locations to the map
// ----------------------------------------------

const points = [];
locations.forEach((loc) => {
  // Create points
  points.push([loc.coordinates[1], loc.coordinates[0]]);

  // Add markers
  L.marker([loc.coordinates[1], loc.coordinates[0]], { icon: greenIcon })
    .addTo(map)
    // Add popup
    .bindPopup(`<h1>Day ${loc.day}: ${loc.description}</h1>`, {
      autoClose: false,
    })
    .openPopup();
});

// ----------------------------------------------
// Set map bounds to include current location
// ----------------------------------------------

const bounds = L.latLngBounds(points).pad(0.5);
map.fitBounds(bounds);

// Disable scroll on map
map.scrollWheelZoom.disable();
