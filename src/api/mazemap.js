const CAMPUS_ID = 742;

export { CAMPUS_ID };

export async function searchLocations(query) {
  if (!query || query.length < 2) return [];

  const equeryUrl = `https://api.mazemap.com/search/equery/?campusid=${CAMPUS_ID}&q=${encodeURIComponent(query)}&lang=en&rows=10`;

  try {
    const data = await fetch(equeryUrl).then(r => r.json());
    const results = data.result || data.pois || [];

    const stripHtml = s => s ? s.replace(/<[^>]*>/g, '').trim() : s;

    return results.map(item => ({
      title:        stripHtml(item.title || item.name || item.buildingName || 'Unknown'),
      buildingName: item.buildingName || null,
      floorName:    item.floorName || null,
      point:        item.point || (item.geometry?.coordinates
                      ? { coordinates: item.geometry.coordinates }
                      : null),
      z:            item.z ?? 0,
      poiId:        item.poiId || null,
      _type:        item.type || 'poi',
    }));
  } catch (e) {
    console.warn('equery failed, falling back to /api/pois/', e);
    const data = await fetch(
      `https://api.mazemap.com/api/pois/?campusid=${CAMPUS_ID}&query=${encodeURIComponent(query)}&lang=en&rows=10`
    ).then(r => r.json());
    return data.pois || [];
  }
}

export function mercatorToLatLng(x, y) {
  const lng = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return { lat, lng };
}

export function getPoiLatLng(poi) {
  const coords = poi.point?.coordinates;
  if (!coords) return null;
  if (Math.abs(coords[0]) > 180) {
    return mercatorToLatLng(coords[0], coords[1]);
  }
  return { lat: coords[1], lng: coords[0] };
}

export function buildMapEmbedUrl(startCoords, endCoords, startZ, endZ) {
  return `https://use.mazemap.com/?campusid=${CAMPUS_ID}` +
    `&starttype=point&start=${startCoords.lng},${startCoords.lat},${startZ}` +
    `&desttype=point&dest=${endCoords.lng},${endCoords.lat},${endZ}`;
}

export async function fetchRoute(selectedStart, selectedEnd) {
  const startCoords = getPoiLatLng(selectedStart);
  const endCoords = getPoiLatLng(selectedEnd);

  if (!startCoords || !endCoords) {
    throw new Error('Could not get coordinates for selected locations.');
  }

  const startZ = selectedStart.z || 0;
  const endZ = selectedEnd.z || 0;

  const startId = selectedStart.poiId || selectedStart.id;
  const endId = selectedEnd.poiId || selectedEnd.id;

  const params = new URLSearchParams({ campusCollectionId: CAMPUS_ID, mode: 'PEDESTRIAN', lang: 'en' });
  if (startId) params.set('fromPoiId', startId);
  else params.set('fromLngLatZ', `${startCoords.lng},${startCoords.lat},${startZ}`);
  if (endId) params.set('toPoiId', endId);
  else params.set('toLngLatZ', `${endCoords.lng},${endCoords.lat},${endZ}`);

  const url = `https://routing.mazemap.com/routing/v2/a-to-b/?${params}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Routing API returned ${response.status}`);
  const data = await response.json();

  return { tripData: data, startCoords, endCoords, startZ, endZ };
}

export function extractInstructions(tripData, selectedStart, selectedEnd) {
  if (!tripData) return { steps: [], error: 'No route data received.' };

  // Response: { routes: [{ legs: [{ instructions: { steps: [...] }, basic: { steps: [...] } }], properties: { timeEstimateSeconds } }] }
  const route = tripData.routes?.[0];
  if (!route) return { steps: [], error: 'Route data has an unexpected format.' };

  const steps = [];

  try {
    const instrSteps = route.legs?.[0]?.instructions?.steps || [];
    // basic.steps carry per-step distance; zip them with instruction steps
    const basicSteps = route.legs?.[0]?.basic?.steps || [];

    instrSteps.forEach((step, i) => {
      const text = step.instruction || '';
      if (!text) return;
      const distanceMeters = basicSteps[i]?.properties?.distance ?? 0;
      const durationSeconds = basicSteps[i]?.properties?.timeEstimateSeconds ?? 0;
      steps.push({ text, distanceMeters, durationSeconds, floor: null });
    });
  } catch (e) {
    return { steps: [], error: `Failed to parse route steps: ${e.message}` };
  }

  const totalTime = route.properties?.timeEstimateSeconds ?? 0;
  const totalDistance = steps.reduce((sum, s) => sum + (s.distanceMeters || 0), 0);

  if (steps.length === 0) {
    steps.push({
      text: `Walk from ${selectedStart?.title || 'Start'} to ${selectedEnd?.title || 'Destination'}`,
      distanceMeters: totalDistance,
      durationSeconds: totalTime,
      floor: null,
    });
  }

  return { steps, error: null, totalDistance, totalTime };
}

export function parseRouteSteps(tripData, selectedStart, selectedEnd) {
  let totalDistance = 0;
  let totalTime = 0;
  const allSteps = [];

  const legs = tripData?.trip?.legs
    || tripData?.legs
    || tripData?.routes?.[0]?.legs
    || [];

  legs.forEach(leg => {
    const steps = leg.maneuvers || leg.steps || leg.instructions || [];
    steps.forEach(step => {
      const distanceMeters = step.length != null
        ? step.length * 1000
        : (step.distance || 0);
      const durationSeconds = step.time || step.duration || 0;

      totalDistance += distanceMeters;
      totalTime += durationSeconds;

      let text = step.instruction || step.text || step.description || step.name || '';
      if (!text && step.action) text = step.action;

      if (text) {
        allSteps.push({ text, distanceMeters, time: durationSeconds, floor: step.floor || step.z });
      }
    });
  });

  if (allSteps.length === 0) {
    const summary = tripData?.trip?.summary || tripData?.summary || null;
    if (summary) {
      totalDistance = summary.length != null ? summary.length * 1000 : (summary.distance || 0);
      totalTime = summary.time || summary.duration || 0;
    }
    allSteps.push({
      text: `Walk from ${selectedStart?.title || 'Start'} to ${selectedEnd?.title || 'Destination'}`,
      distanceMeters: totalDistance,
      time: totalTime,
    });
  }

  return { steps: allSteps, totalDistance, totalTime };
}
