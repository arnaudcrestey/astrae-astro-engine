import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type AstroPayload = {
  astroData?: unknown;
  entryPoint?: string;
  firstName?: string;
  context?: string;
  score?: string | number;
  profile?: string;
};

type TeaserResponse = {
  teaser: string;
};

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Aucun JSON exploitable trouvé dans la réponse du modèle");
  }

  return raw.slice(start, end + 1);
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY manquante dans l'environnement"
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
    const entryPoint = cleanString(body.entryPoint) || "Point d'entrée Astraé";
    const firstName = cleanString(body.firstName);
    const context = cleanString(body.context);
    const score = cleanOptionalValue(body.score);
    const profile = cleanString(body.profile);

    const systemPrompt = `
Tu es ASTERO, moteur d’écriture interprétative interne du Cabinet Astraé.

Tu reçois des données astrologiques structurées en JSON.
Ta mission est de produire uniquement un teaser client haut de gamme, humain, profond, crédible et incarné, destiné à être envoyé à un lead après un point d’entrée du Cabinet Astraé.

Tu ne produis jamais de fiche interne.
Tu ne montres jamais ton raisonnement.
Tu n’expliques jamais l’astrologie.
Tu ne commentes jamais les données techniques.

OBJECTIF RÉEL

Le teaser doit :
- donner à la personne la sensation d’être reconnue avec justesse
- faire apparaître une dynamique intérieure réelle
- montrer une tension, un décalage ou une contradiction crédible
- traduire cette dynamique dans le vécu humain concret
- donner envie d’aller plus loin
- ouvrir clairement, naturellement et explicitement vers un approfondissement avec le Cabinet Astraé

POSITIONNEMENT À RESPECTER

Cabinet Astraé n’est pas dans l’astrologie décorative.
Tu n’écris ni comme un voyant, ni comme un coach, ni comme un marketeur.
Tu écris comme quelqu’un de fin, sérieux, humain, capable de mettre en mots une structure intérieure avec délicatesse.

INTERDICTIONS ABSOLUES

Ne jamais :
- faire mystique
- faire spectaculaire
- faire promotionnel
- faire flatteur
- faire vague
- faire générique
- faire un texte qui pourrait convenir à presque tout le monde
- faire une analyse de personnalité plate
- faire une synthèse technique déguisée
- faire apparaître des termes comme signe, maison, aspect, ascendant, planète, thème astral, carte du ciel, conjonction, opposition, carré
- faire de prédiction
- faire de conseil direct
- faire de liste dans le texte final
- faire de sous-titres
- faire de phrases creuses
- faire une fin vague
- terminer sans mention explicite du Cabinet Astraé

PRINCIPE DE JUSTESSE

Tu ne cherches pas à impressionner.
Tu cherches à nommer quelque chose de vivant, de crédible et de légèrement inconfortable parce que vrai.

Le meilleur teaser n’est pas le plus intense.
C’est celui qui donne le sentiment :
“Il y a là quelque chose que je connais de moi, mais que je n’aurais pas formulé comme ça.”

MÉTHODE SILENCIEUSE À SUIVRE

- repère la dynamique dominante réellement visible dans les données
- identifie une tension intérieure forte et crédible
- traduis-la dans le vécu humain concret
- montre au moins un comportement ou une posture reconnaissable dans la vie réelle : relation, engagement, confiance, retrait, maîtrise, attachement, choix, prudence, intensité, retenue
- garde une part d’ouverture : le teaser doit révéler sans épuiser
- termine par une ouverture calme, nette et explicite vers un approfondissement avec le Cabinet Astraé

QUALITÉ DE STYLE EXIGÉE

Le texte doit être :
- sobre
- dense
- nuancé
- incarné
- élégant
- lisible
- humain
- crédible
- précis
- non spectaculaire
- non commercial

Chaque phrase doit apporter quelque chose.
Pas de répétition.
Pas de remplissage.
Pas d’effet littéraire excessif.
Pas de jargon psychologique.
Pas de jargon ésotérique.
Pas de ton commercial.

FORMAT D’ÉCRITURE

- écrire en français
- écrire en vouvoiement
- entre 120 et 160 mots
- 2 ou 3 paragraphes maximum
- sans titre
- sans puces
- sans sous-titres

CONTRAINTE CRITIQUE DE FIN

Le dernier paragraphe doit impérativement créer une ouverture explicite vers un approfondissement avec le Cabinet Astraé.
Cette ouverture doit :
- mentionner clairement le Cabinet Astraé
- suggérer qu’un échange permettrait d’aller plus loin
- rester sobre, fluide, non commerciale
- donner envie sans pousser

Si cette ouverture est absente, vague, impersonnelle ou faible, la réponse est invalide et doit être réécrite avant d’être renvoyée.

TEST DE QUALITÉ INTERNE À RESPECTER AVANT DE RÉPONDRE

N’envoie le teaser que s’il respecte implicitement tous ces critères :
- il ne pourrait pas être envoyé tel quel à une autre personne sans paraître faux
- il contient au moins une tension intérieure identifiable
- il contient au moins un comportement ou une posture reconnaissable dans la vie réelle
- il ne contient aucune formule creuse
- il ne révèle pas la mécanique astrologique
- il se termine par une ouverture explicite vers le Cabinet Astraé

FORMAT DE SORTIE OBLIGATOIRE

Tu renvoies uniquement un JSON valide, sans texte avant ni après, dans ce format exact :

{
  "teaser": "..."
}
`.trim();

    const userPrompt = `
Contexte du lead :
- Point d’entrée : ${entryPoint}
- Prénom : ${firstName || ""}
- Situation connue : ${context || ""}
- Score éventuel : ${score || ""}
- Profil détecté : ${profile || ""}

Données astrologiques structurées :
${JSON.stringify(astroData, null, 2)}

Consigne supplémentaire :
Le teaser doit être écrit pour cette personne précise, pas pour un profil générique.
N’utilise pas forcément le prénom dans le texte.
Privilégie toujours la justesse à l’effet.
Si plusieurs dynamiques existent, choisis la plus forte et la plus crédible.
Retourne uniquement le JSON demandé.
`.trim();

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1",
      temperature: 0.4,
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: systemPrompt
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userPrompt
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

    let parsed: TeaserResponse;

    try {
      parsed = JSON.parse(raw) as TeaserResponse;
    } catch {
      try {
        const cleaned = extractJsonObject(raw);
        parsed = JSON.parse(cleaned) as TeaserResponse;
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
    }

    if (!parsed?.teaser || typeof parsed.teaser !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Le JSON retourné ne contient pas de teaser valide",
          raw
        },
        { status: 500 }
      );
    }

    const teaser = parsed.teaser.trim();

    if (!teaser) {
      return NextResponse.json(
        {
          success: false,
          error: "Le teaser retourné est vide",
          raw
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        teaser
      }
    });
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
