import { NextResponse } from "next/server";
import { calculateAstro } from "@/lib/astroEngine";
import { getCoordinates } from "@/lib/geocode";

type Coordinates = {
  lat: number;
  lon: number;
  displayName: string;
};

type AstroCalculationResult = ReturnType<typeof calculateAstro>;

function parseTimezoneOffset(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseStringField(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildAstroSummary(result: AstroCalculationResult) {
  return {
    sun: result.sun.sign,
    moon: result.moon.sign,
    ascendant: result.ascendant.sign,
    mc: result.mc.sign
  };
}

function buildAsteroJson(params: {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezoneOffset: number;
  coordinates: Coordinates;
  result: AstroCalculationResult;
}) {
  const { birthDate, birthTime, birthPlace, timezoneOffset, coordinates, result } =
    params;

  return {
    schema: "astrae-astrology-v1",
    identity: {
      birthDate,
      birthTime,
      birthPlace,
      timezoneOffset,
      coordinates: {
        lat: coordinates.lat,
        lon: coordinates.lon,
        displayName: coordinates.displayName
      }
    },
    summary: buildAstroSummary(result),
    planets: {
      sun: {
        sign: result.sun.sign,
        degree: result.sun.degreeInSign,
        longitude: result.sun.longitude,
        source: result.sun.source
      },
      moon: {
        sign: result.moon.sign,
        degree: result.moon.degreeInSign,
        longitude: result.moon.longitude,
        source: result.moon.source
      }
    },
    angles: {
      ascendant: {
        sign: result.ascendant.sign,
        degree: result.ascendant.degreeInSign,
        longitude: result.ascendant.longitude,
        source: result.ascendant.source
      },
      mc: {
        sign: result.mc.sign,
        degree: result.mc.degreeInSign,
        longitude: result.mc.longitude,
        source: result.mc.source
      }
    },
    houses: null,
    aspects: null,
    interpretationInput: {
      dominantTriplet: {
        sun: result.sun.sign,
        moon: result.moon.sign,
        ascendant: result.ascendant.sign
      },
      angularFocus: {
        ascendant: result.ascendant.sign,
        mc: result.mc.sign
      }
    }
  };
}

function buildApiResponse(params: {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezoneOffset: number;
  coordinates: Coordinates;
  result: AstroCalculationResult;
}) {
  const astero = buildAsteroJson(params);

  return {
    success: true,
    data: {
      identity: astero.identity,
      summary: astero.summary,
      planets: astero.planets,
      angles: astero.angles,
      houses: astero.houses,
      aspects: astero.aspects,
      astero,
      meta: {
        source: "astrae-engine",
        version: "1.4.0",
        engine: "astroEngine-v5",
        timestamp: new Date().toISOString(),
        computation: params.result.meta
      }
    }
  };
}

async function computeAstroResponse(params: {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezoneOffset: number;
}) {
  const coordinates = await getCoordinates(params.birthPlace);

  const result = calculateAstro({
    birthDate: params.birthDate,
    birthTime: params.birthTime,
    birthPlace: params.birthPlace,
    lat: coordinates.lat,
    lon: coordinates.lon,
    timezoneOffset: params.timezoneOffset
  });

  return buildApiResponse({
    birthDate: params.birthDate,
    birthTime: params.birthTime,
    birthPlace: params.birthPlace,
    timezoneOffset: params.timezoneOffset,
    coordinates,
    result
  });
}

/**
 * GET testable directement dans le navigateur
 *
 * Exemples :
 * /api/astro/calculate
 * /api/astro/calculate?birthDate=1978-10-17&birthTime=14:20&birthPlace=Bayeux&timezoneOffset=1
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const birthDate =
      parseStringField(url.searchParams.get("birthDate")) ?? "1978-10-17";

    const birthTime =
      parseStringField(url.searchParams.get("birthTime")) ?? "14:20";

    const birthPlace =
      parseStringField(url.searchParams.get("birthPlace")) ?? "Bayeux";

    const timezoneOffset =
      parseTimezoneOffset(url.searchParams.get("timezoneOffset")) ?? 1;

    return NextResponse.json(
      await computeAstroResponse({
        birthDate,
        birthTime,
        birthPlace,
        timezoneOffset
      })
    );
  } catch (error) {
    console.error("GET /api/astro/calculate error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne GET /api/astro/calculate"
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const birthDate = parseStringField(body?.birthDate);
    const birthTime = parseStringField(body?.birthTime);
    const birthPlace = parseStringField(body?.birthPlace);
    const timezoneOffset = parseTimezoneOffset(body?.timezoneOffset);

    if (!birthDate || !birthTime || !birthPlace) {
      return NextResponse.json(
        {
          success: false,
          error: "birthDate, birthTime et birthPlace sont requis"
        },
        { status: 400 }
      );
    }

    if (timezoneOffset === null) {
      return NextResponse.json(
        {
          success: false,
          error: "timezoneOffset est requis (ex: 1, 2, 5.5)"
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await computeAstroResponse({
        birthDate,
        birthTime,
        birthPlace,
        timezoneOffset
      })
    );
  } catch (error) {
    console.error("POST /api/astro/calculate error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne POST /api/astro/calculate"
      },
      { status: 500 }
    );
  }
}