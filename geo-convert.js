const fs = require('fs');
const path = require('path');
const { feature } = require('topojson-client');

const topoPath = path.join(__dirname, 'node_modules', 'us-atlas', 'counties-10m.json');
const topo = JSON.parse(fs.readFileSync(topoPath));

const statesGeo = feature(topo, topo.objects.states);
const countiesGeo = feature(topo, topo.objects.counties);

function getBBox(geometry) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const extract = (arr) => {
    if (typeof arr[0] === 'number') {
      const [lng, lat] = arr;
      if (lng < minX) minX = lng;
      if (lat < minY) minY = lat;
      if (lng > maxX) maxX = lng;
      if (lat > maxY) maxY = lat;
    } else {
      arr.forEach(extract);
    }
  };
  extract(geometry.coordinates);
  return [minX, minY, maxX, maxY];
}

const states = statesGeo.features.map(f => ({
  id: f.id,
  name: f.properties.name,
  bbox: getBBox(f.geometry),
  geometry: f.geometry,
}));

const geoDir = path.join(__dirname, 'src', 'geo');
const countiesDir = path.join(geoDir, 'counties');
fs.mkdirSync(countiesDir, { recursive: true });

fs.writeFileSync(path.join(geoDir, 'states.json'), JSON.stringify(states));

const grouped = {};
countiesGeo.features.forEach(f => {
  const stateFips = String(f.id).substring(0, 2);
  if (!grouped[stateFips]) grouped[stateFips] = [];
  grouped[stateFips].push({
    id: f.id,
    name: f.properties.name,
    state: stateFips,
    bbox: getBBox(f.geometry),
    geometry: f.geometry,
  });
});

let totalCounties = 0;
Object.keys(grouped).forEach(state => {
  const list = grouped[state];
  totalCounties += list.length;
  fs.writeFileSync(path.join(countiesDir, `${state}.json`), JSON.stringify(list));
});

console.log(`OK states=${states.length} stateFiles=${Object.keys(grouped).length} counties=${totalCounties}`);
