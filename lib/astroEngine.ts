export type AstroInput = {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  lat: number;
  lon: number;
  timezoneOffset: number; // ex: France hiver = 1, été = 2
};

export type ZodiacResult = {
  sign: string;
  degreeInSign: number;
  longitude: number;
  source: string;
};

export type AstroComputationMeta = {
  utcDateIso: string;
  julianDay: number;
  obliquity: number;
  greenwichMeanSiderealTime: number;
  localSiderealTime: number;
};

export type AstroResult = {
  sun: ZodiacResult;
  moon: ZodiacResult;
  ascendant: ZodiacResult;
  mc: ZodiacResult;
  meta: AstroComputationMeta;
};

const SIGNS = [
  "Bélier",
  "Taureau",
  "Gémeaux",
  "Cancer",
  "Lion",
  "Vierge",
  "Balance",
  "Scorpion",
  "Sagittaire",
  "Capricorne",
  "Verseau",
  "Poissons"
] as const;

function normalizeAngle(angle: number): number {
  let result = angle % 360;
  if (result < 0) result += 360;
  return result;
}

function roundNumber(value: number, digits = 12): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

function sinDeg(deg: number): number {
  return Math.sin(toRadians(deg));
}

function cosDeg(deg: number): number {
  return Math.cos(toRadians(deg));
}

function tanDeg(deg: number): number {
  return Math.tan(toRadians(deg));
}

function atan2Deg(y: number, x: number): number {
  return toDegrees(Math.atan2(y, x));
}

function parseBirthDate(birthDate: string) {
  if (!birthDate || typeof birthDate !== "string") {
    throw new Error("birthDate manquante");
  }

  const parts = birthDate.split("-");
  if (parts.length !== 3) {
    throw new Error("Format birthDate invalide. Attendu : YYYY-MM-DD");
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error("birthDate invalide");
  }

  if (month < 1 || month > 12) {
    throw new Error("Mois invalide dans birthDate");
  }

  if (day < 1 || day > 31) {
    throw new Error("Jour invalide dans birthDate");
  }

  return { year, month, day };
}

function parseBirthTime(birthTime: string) {
  if (!birthTime || typeof birthTime !== "string") {
    throw new Error("birthTime manquante");
  }

  const parts = birthTime.split(":");
  if (parts.length < 2) {
    throw new Error("Format birthTime invalide. Attendu : HH:MM");
  }

  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error("birthTime invalide");
  }

  return { hour, minute };
}

function validateCoordinates(lat: number, lon: number) {
  if (typeof lat !== "number" || Number.isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error("Latitude invalide");
  }

  if (
    typeof lon !== "number" ||
    Number.isNaN(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error("Longitude invalide");
  }
}

function validateTimezoneOffset(timezoneOffset: number) {
  if (
    typeof timezoneOffset !== "number" ||
    Number.isNaN(timezoneOffset) ||
    timezoneOffset < -12 ||
    timezoneOffset > 14
  ) {
    throw new Error("timezoneOffset invalide");
  }
}

/**
 * Convertit la date/heure locale de naissance en UTC réel.
 * Supporte aussi les décalages fractionnaires si besoin un jour (ex: 5.5).
 */
function buildUtcDateFromLocal(
  birthDate: string,
  birthTime: string,
  timezoneOffset: number
): Date {
  const { year, month, day } = parseBirthDate(birthDate);
  const { hour, minute } = parseBirthTime(birthTime);

  const offsetHours = Math.trunc(timezoneOffset);
  const offsetMinutes = Math.round((timezoneOffset - offsetHours) * 60);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour - offsetHours,
      minute - offsetMinutes,
      0,
      0
    )
  );
}

function getJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Obliquité moyenne de l’écliptique.
 */
function getObliquity(julianDay: number): number {
  const T = (julianDay - 2451545.0) / 36525.0;
  return 23.439291 - 0.0130042 * T;
}

/**
 * Temps sidéral moyen de Greenwich, en degrés.
 */
function getGreenwichMeanSiderealTime(julianDay: number): number {
  const T = (julianDay - 2451545.0) / 36525.0;

  return normalizeAngle(
    280.46061837 +
      360.98564736629 * (julianDay - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000
  );
}

/**
 * Temps sidéral local = GMST + longitude géographique.
 * Longitude Est positive, Ouest négative.
 */
function getLocalSiderealTime(julianDay: number, longitude: number): number {
  return normalizeAngle(
    getGreenwichMeanSiderealTime(julianDay) + longitude
  );
}

function buildZodiacResult(longitude: number, source: string): ZodiacResult {
  const normalized = normalizeAngle(longitude);
  const signIndex = Math.floor(normalized / 30);
  const degreeInSign = normalized % 30;

  return {
    sign: SIGNS[signIndex],
    degreeInSign: roundNumber(degreeInSign),
    longitude: roundNumber(normalized),
    source
  };
}

/**
 * Soleil tropical approximatif, largement suffisant pour Astraé V1/V2.
 */
function getSunPosition(dateUtc: Date): ZodiacResult {
  const jd = getJulianDay(dateUtc);
  const d = jd - 2451545.0;

  const meanLongitude = normalizeAngle(280.460 + 0.9856474 * d);
  const meanAnomaly = normalizeAngle(357.528 + 0.9856003 * d);

  const eclipticLongitude = normalizeAngle(
    meanLongitude +
      1.915 * sinDeg(meanAnomaly) +
      0.020 * sinDeg(2 * meanAnomaly)
  );

  return buildZodiacResult(eclipticLongitude, "solar-approx-v5");
}

/**
 * Lune simplifiée mais crédible pour usage Astraé.
 */
function getMoonPosition(dateUtc: Date): ZodiacResult {
  const jd = getJulianDay(dateUtc);
  const d = jd - 2451545.0;

  const L0 = normalizeAngle(218.316 + 13.176396 * d);
  const Mmoon = normalizeAngle(134.963 + 13.064993 * d);
  const Msun = normalizeAngle(357.529 + 0.98560028 * d);
  const D = normalizeAngle(297.850 + 12.190749 * d);
  const F = normalizeAngle(93.272 + 13.22935 * d);

  const longitude = normalizeAngle(
    L0 +
      6.289 * sinDeg(Mmoon) +
      1.274 * sinDeg(2 * D - Mmoon) +
      0.658 * sinDeg(2 * D) +
      0.214 * sinDeg(2 * Mmoon) -
      0.186 * sinDeg(Msun) -
      0.059 * sinDeg(2 * D - 2 * Mmoon) -
      0.057 * sinDeg(2 * D - Msun - Mmoon) +
      0.053 * sinDeg(2 * D + Mmoon) +
      0.046 * sinDeg(2 * D - Msun) +
      0.041 * sinDeg(Msun - Mmoon) -
      0.035 * sinDeg(D) -
      0.031 * sinDeg(Msun + Mmoon) -
      0.015 * sinDeg(2 * F - 2 * D) +
      0.011 * sinDeg(Mmoon - 4 * D)
  );

  return buildZodiacResult(longitude, "lunar-approx-v5");
}

/**
 * Milieu du Ciel (MC)
 */
function getMcPosition(
  localSiderealTime: number,
  obliquity: number
): ZodiacResult {
  const longitude = normalizeAngle(
    atan2Deg(
      sinDeg(localSiderealTime),
      cosDeg(localSiderealTime) * cosDeg(obliquity)
    )
  );

  return buildZodiacResult(longitude, "computed-mc-v2");
}

/**
 * Ascendant
 * La formule utilisée ici est celle qui a corrigé ton cas réel.
 */
function getAscendantPosition(
  localSiderealTime: number,
  latitude: number,
  obliquity: number
): ZodiacResult {
  const rawLongitude = atan2Deg(
    -cosDeg(localSiderealTime),
    sinDeg(localSiderealTime) * cosDeg(obliquity) +
      tanDeg(latitude) * sinDeg(obliquity)
  );

  const longitude = normalizeAngle(rawLongitude + 180);

  return buildZodiacResult(longitude, "computed-asc-v3");
}

export function calculateAstro(input: AstroInput): AstroResult {
  const { birthDate, birthTime, lat, lon, timezoneOffset } = input;

  validateCoordinates(lat, lon);
  validateTimezoneOffset(timezoneOffset);

  const utcDate = buildUtcDateFromLocal(
    birthDate,
    birthTime,
    timezoneOffset
  );

  if (Number.isNaN(utcDate.getTime())) {
    throw new Error("Date UTC invalide");
  }

  const julianDay = getJulianDay(utcDate);
  const obliquity = getObliquity(julianDay);
  const greenwichMeanSiderealTime =
    getGreenwichMeanSiderealTime(julianDay);
  const localSiderealTime = getLocalSiderealTime(julianDay, lon);

  const sun = getSunPosition(utcDate);
  const moon = getMoonPosition(utcDate);
  const ascendant = getAscendantPosition(localSiderealTime, lat, obliquity);
  const mc = getMcPosition(localSiderealTime, obliquity);

  return {
    sun,
    moon,
    ascendant,
    mc,
    meta: {
      utcDateIso: utcDate.toISOString(),
      julianDay: roundNumber(julianDay),
      obliquity: roundNumber(obliquity),
      greenwichMeanSiderealTime: roundNumber(greenwichMeanSiderealTime),
      localSiderealTime: roundNumber(localSiderealTime)
    }
  };
}