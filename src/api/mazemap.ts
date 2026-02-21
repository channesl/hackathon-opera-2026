const CAMPUS_ID = 742;

export { CAMPUS_ID };

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Poi {
  title: string;
  buildingName: string | null;
  floorName: string | null;
  point: { coordinates: number[] } | null;
  z: number;
  poiId: number | null;
  _type: string;
}

export interface RouteStep {
  text: string;
  distanceMeters: number;
  durationSeconds: number;
  floor: number | null;
}

export interface ExtractedRoute {
  steps: RouteStep[];
  error: string | null;
  totalDistance: number;
  totalTime: number;
}

export interface FetchRouteResult {
  tripData: unknown;
  startCoords: LatLng;
  endCoords: LatLng;
  startZ: number;
  endZ: number;
}

export async function searchLocations(query: string): Promise<Poi[]> {
  if (!query || query.length < 2) return [];

  const equeryUrl = `https://api.mazemap.com/search/equery/?campusid=${CAMPUS_ID}&q=${encodeURIComponent(query)}&lang=en&rows=10`;

  try {
    const data = await fetch(equeryUrl).then(r => r.json());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = data.result || data.pois || [];

    const stripHtml = (s: string | null | undefined): string =>
      s ? s.replace(/<[^>]*>/g, '').trim() : '';

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

export function mercatorToLatLng(x: number, y: number): LatLng {
  const lng = (x / 20037508.34) * 180;
  let lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return { lat, lng };
}

export function getPoiLatLng(poi: Poi): LatLng | null {
  const coords = poi.point?.coordinates;
  if (!coords) return null;
  if (Math.abs(coords[0]) > 180) {
    return mercatorToLatLng(coords[0], coords[1]);
  }
  return { lat: coords[1], lng: coords[0] };
}

export function buildMapEmbedUrl(startCoords: LatLng, endCoords: LatLng, startZ: number, endZ: number): string {
  return `https://use.mazemap.com/?campusid=${CAMPUS_ID}` +
    `&starttype=point&start=${startCoords.lng},${startCoords.lat},${startZ}` +
    `&desttype=point&dest=${endCoords.lng},${endCoords.lat},${endZ}`;
}

export async function fetchRoute(selectedStart: Poi, selectedEnd: Poi): Promise<FetchRouteResult> {
  const startCoords = getPoiLatLng(selectedStart);
  const endCoords = getPoiLatLng(selectedEnd);

  if (!startCoords || !endCoords) {
    throw new Error('Could not get coordinates for selected locations.');
  }

  const startZ = selectedStart.z || 0;
  const endZ = selectedEnd.z || 0;

  const startId = selectedStart.poiId;
  const endId = selectedEnd.poiId;

  const params = new URLSearchParams({ campusCollectionId: String(CAMPUS_ID), mode: 'PEDESTRIAN', lang: 'en' });
  if (startId) params.set('fromPoiId', String(startId));
  else params.set('fromLngLatZ', `${startCoords.lng},${startCoords.lat},${startZ}`);
  if (endId) params.set('toPoiId', String(endId));
  else params.set('toLngLatZ', `${endCoords.lng},${endCoords.lat},${endZ}`);

  const url = `https://routing.mazemap.com/routing/v2/a-to-b/?${params}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Routing API returned ${response.status}`);
  const data = await response.json();

  return { tripData: data, startCoords, endCoords, startZ, endZ };
}

interface RouteApiResponse {
  routes?: Array<{
    legs?: Array<{
      instructions?: { steps?: Array<{ instruction?: string }> };
      basic?: { steps?: Array<{ properties?: { distance?: number; timeEstimateSeconds?: number } }> };
    }>;
    properties?: { timeEstimateSeconds?: number };
  }>;
}

export function extractInstructions(tripData: unknown, selectedStart: Poi, selectedEnd: Poi): ExtractedRoute {
  if (!tripData) return { steps: [], error: 'No route data received.', totalDistance: 0, totalTime: 0 };

  const data = tripData as RouteApiResponse;
  const route = data.routes?.[0];
  if (!route) return { steps: [], error: 'Route data has an unexpected format.', totalDistance: 0, totalTime: 0 };

  const steps: RouteStep[] = [];

  try {
    const instrSteps = route.legs?.[0]?.instructions?.steps || [];
    const basicSteps = route.legs?.[0]?.basic?.steps || [];

    instrSteps.forEach((step, i) => {
      const text = step.instruction || '';
      if (!text) return;
      const distanceMeters = basicSteps[i]?.properties?.distance ?? 0;
      const durationSeconds = basicSteps[i]?.properties?.timeEstimateSeconds ?? 0;
      steps.push({ text, distanceMeters, durationSeconds, floor: null });
    });
  } catch (e) {
    const err = e as Error;
    return { steps: [], error: `Failed to parse route steps: ${err.message}`, totalDistance: 0, totalTime: 0 };
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

interface LegacyStep {
  text: string;
  distanceMeters: number;
  time: number;
  floor?: number;
}

interface LegacyRouteResult {
  steps: LegacyStep[];
  totalDistance: number;
  totalTime: number;
}

export function parseRouteSteps(tripData: unknown, selectedStart: Poi, selectedEnd: Poi): LegacyRouteResult {
  let totalDistance = 0;
  let totalTime = 0;
  const allSteps: LegacyStep[] = [];

  const data = tripData as {
    trip?: { legs?: unknown[]; summary?: { length?: number; distance?: number; time?: number; duration?: number } };
    legs?: unknown[];
    routes?: Array<{ legs?: unknown[] }>;
  };

  const legs = (data?.trip?.legs || data?.legs || data?.routes?.[0]?.legs || []) as Array<{
    maneuvers?: unknown[];
    steps?: unknown[];
    instructions?: unknown[];
  }>;

  legs.forEach(leg => {
    const steps = (leg.maneuvers || leg.steps || leg.instructions || []) as Array<{
      length?: number;
      distance?: number;
      time?: number;
      duration?: number;
      instruction?: string;
      text?: string;
      description?: string;
      name?: string;
      action?: string;
      floor?: number;
      z?: number;
    }>;

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
    const summary = data?.trip?.summary || null;
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
