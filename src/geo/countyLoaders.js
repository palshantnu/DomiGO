/**
 * countyLoaders — static require map, Metro-friendly.
 *
 * Metro can't resolve dynamic requires (`require(`./counties/${fips}.json`)`).
 * Each state's county file must be listed explicitly so the bundler includes it.
 *
 * Regenerate with the node snippet in CITY_CHANGE_PLAN_2026-04-20.md Phase 1.
 *
 * Keys are 2-digit state FIPS codes (e.g. '06' = California, '36' = New York).
 * Each loader returns an array of { id, name, state, bbox, geometry }.
 */
const countyLoaders = {
  '01': () => require('./counties/01.json'),
  '02': () => require('./counties/02.json'),
  '04': () => require('./counties/04.json'),
  '05': () => require('./counties/05.json'),
  '06': () => require('./counties/06.json'),
  '08': () => require('./counties/08.json'),
  '09': () => require('./counties/09.json'),
  '10': () => require('./counties/10.json'),
  '11': () => require('./counties/11.json'),
  '12': () => require('./counties/12.json'),
  '13': () => require('./counties/13.json'),
  '15': () => require('./counties/15.json'),
  '16': () => require('./counties/16.json'),
  '17': () => require('./counties/17.json'),
  '18': () => require('./counties/18.json'),
  '19': () => require('./counties/19.json'),
  '20': () => require('./counties/20.json'),
  '21': () => require('./counties/21.json'),
  '22': () => require('./counties/22.json'),
  '23': () => require('./counties/23.json'),
  '24': () => require('./counties/24.json'),
  '25': () => require('./counties/25.json'),
  '26': () => require('./counties/26.json'),
  '27': () => require('./counties/27.json'),
  '28': () => require('./counties/28.json'),
  '29': () => require('./counties/29.json'),
  '30': () => require('./counties/30.json'),
  '31': () => require('./counties/31.json'),
  '32': () => require('./counties/32.json'),
  '33': () => require('./counties/33.json'),
  '34': () => require('./counties/34.json'),
  '35': () => require('./counties/35.json'),
  '36': () => require('./counties/36.json'),
  '37': () => require('./counties/37.json'),
  '38': () => require('./counties/38.json'),
  '39': () => require('./counties/39.json'),
  '40': () => require('./counties/40.json'),
  '41': () => require('./counties/41.json'),
  '42': () => require('./counties/42.json'),
  '44': () => require('./counties/44.json'),
  '45': () => require('./counties/45.json'),
  '46': () => require('./counties/46.json'),
  '47': () => require('./counties/47.json'),
  '48': () => require('./counties/48.json'),
  '49': () => require('./counties/49.json'),
  '50': () => require('./counties/50.json'),
  '51': () => require('./counties/51.json'),
  '53': () => require('./counties/53.json'),
  '54': () => require('./counties/54.json'),
  '55': () => require('./counties/55.json'),
  '56': () => require('./counties/56.json'),
  '60': () => require('./counties/60.json'),
  '66': () => require('./counties/66.json'),
  '69': () => require('./counties/69.json'),
  '72': () => require('./counties/72.json'),
  '78': () => require('./counties/78.json'),
};

export default countyLoaders;
