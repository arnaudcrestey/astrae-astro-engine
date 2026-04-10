export async function getCoordinates(city: string) {
  if (!city || typeof city !== "string") {
    throw new Error("Ville manquante");
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    city
  )}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "astrae-astro-engine/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Erreur géocodage: ${res.status}`);
  }

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Ville introuvable");
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}