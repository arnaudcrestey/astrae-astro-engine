import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type AstroPayload = {
  astroData?: any;
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY manquante dans .env.local"
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as AstroPayload;

    if (!body?.astroData) {
      return NextResponse.json(
        {
          success: false,
          error: "astroData manquant dans la requête"
        },
        { status: 400 }
      );
    }

    const astroData = body.astroData;

    const prompt = `
Tu es ASTERO, moteur d'interprétation interne du Cabinet Astraé.

Ta mission :
À partir de données astrologiques structurées en JSON, produire une lecture sobre, humaine, précise, non ésotérique, non spectaculaire.

Contraintes absolues :
- pas de jargon astrologique inutile
- pas de ton mystique
- pas de flatterie
- pas de prédiction
- pas de généralités vagues
- relier au vécu réel, à la dynamique intérieure, aux relations, aux tensions, aux ressources
- ton : sérieux, humain, clair, crédible

Tu dois renvoyer UNIQUEMENT un JSON valide dans ce format exact :

{
  "teaser": "string",
  "ficheInterne": {
    "dynamiqueCentrale": "string",
    "tensionInterieure": "string",
    "rapportAuxRelations": "string",
    "ressources": ["string", "string", "string"],
    "vigilances": ["string", "string", "string"],
    "axesDeSeance": ["string", "string", "string"],
    "questions": ["string", "string", "string", "string"]
  }
}

Consignes de contenu :
- Le teaser doit faire entre 120 et 220 mots
- Le teaser doit donner une impression juste et profonde
- Le teaser doit se terminer par une ouverture naturelle vers un approfondissement avec le Cabinet Astraé
- La fiche interne doit être directement exploitable pour une séance
- Reste concret et nuancé

Voici les données astrologiques à interpréter :
${JSON.stringify(astroData, null, 2)}
`;

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Tu es un assistant d'interprétation astrologique structuré. Tu réponds uniquement en JSON valide."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt
            }
          ]
        }
      ]
    });

    const raw = response.output_text?.trim();

    if (!raw) {
      return NextResponse.json(
        {
          success: false,
          error: "Réponse vide du modèle OpenAI"
        },
        { status: 500 }
      );
    }

    try {
      const parsed = JSON.parse(raw);

      return NextResponse.json({
        success: true,
        data: parsed,
        raw
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Le modèle a répondu, mais pas en JSON valide",
          raw
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur /api/astro/interpret :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur pendant l'interprétation"
      },
      { status: 500 }
    );
  }
}