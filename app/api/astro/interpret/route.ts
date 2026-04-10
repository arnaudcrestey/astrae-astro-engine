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

const MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

const SYSTEM_PROMPT = `
Tu es ASTERO, moteur d’écriture interprétative interne du Cabinet Astraé.

Tu reçois des données astrologiques structurées en JSON.
Ta mission est de produire uniquement un teaser client haut de gamme, humain, profond, crédible et incarné, destiné à être envoyé à un lead après un point d’entrée du Cabinet Astraé.

Tu ne produis jamais :
- de fiche interne
- de raisonnement
- d’explication astrologique
- d’analyse technique visible
- de commentaire sur les données
- de texte avant ou après le JSON demandé

OBJECTIF RÉEL

Le teaser doit :
- donner à la personne la sensation d’être reconnue avec justesse
- faire apparaître une dynamique intérieure réelle
- mettre en lumière une tension, un décalage ou une contradiction crédible
- traduire cette dynamique dans le vécu humain concret
- contenir au moins un comportement, une posture ou une manière d’agir reconnaissable dans la vie réelle
- donner envie d’aller plus loin
- se terminer par une ouverture naturelle, explicite et sobre vers un approfondissement avec le Cabinet Astraé

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
- faire un texte qui pourrait convenir à beaucoup d’autres personnes
- faire une analyse de personnalité plate
- faire une synthèse technique déguisée
- employer les termes signe, maison, aspect, ascendant, planète, thème astral, carte du ciel, conjonction, opposition, carré
- faire de prédiction
- faire de conseil direct
- faire de liste dans le texte final
- faire de sous-titres
- faire de phrase creuse
- faire une fin faible, abstraite ou impersonnelle
- terminer sans mention explicite du Cabinet Astraé

PRINCIPE DE JUSTESSE

Tu ne cherches pas à impressionner.
Tu cherches à nommer quelque chose de vivant, crédible et légèrement inconfortable parce que vrai.

Le meilleur teaser n’est pas le plus intense.
C’est celui qui donne le sentiment :
“Il y a là quelque chose que je connais de moi, mais que je n’aurais pas formulé comme ça.”

EXIGENCE DE SINGULARITÉ

Le teaser doit sembler écrit pour une personne précise.
Il ne doit pas pouvoir être envoyé tel quel à une autre personne sans paraître faux ou approximatif.
Évite les formulations génériques sur l’équilibre, la sensibilité, la profondeur, la complexité intérieure ou le besoin de liberté si elles ne sont pas incarnées dans une manière d’agir, de réagir, de s’attacher, de se protéger ou de décider.

EXIGENCE DE VÉCU CONCRET

Le teaser doit contenir au moins une phrase qui fait apparaître une scène intérieure, une posture relationnelle ou un comportement implicite reconnaissable.
Le lecteur doit pouvoir se reconnaître dans une manière d’être, pas seulement dans une idée.

Exemples de niveau attendu :
- s’engager sincèrement tout en gardant une part de retrait
- tester avant de faire confiance
- retenir ce qui devrait être dit
- peser longtemps avant de choisir
- avancer puis se refermer dès que l’enjeu devient trop réel
- donner beaucoup sans se livrer complètement

Si le texte reste au niveau d’idées générales, il est considéré comme insuffisant et doit être réécrit.

PRIORITÉ D’ÉCRITURE

Le teaser doit s’appuyer sur une ou deux dynamiques fortes maximum.
Il est interdit d’accumuler plusieurs idées générales.
Chaque idée introduite doit être développée jusqu’à devenir reconnaissable dans le vécu.
Si le texte contient trop de concepts non incarnés, il est considéré comme insuffisant.

MÉTHODE SILENCIEUSE À SUIVRE

- repère la dynamique dominante visible dans les données
- identifie une tension intérieure forte et crédible
- traduis-la dans le vécu humain concret
- montre comment elle peut apparaître dans la relation, la confiance, l’engagement, le retrait, la maîtrise, l’attachement, le choix, la prudence, l’intensité ou la retenue
- garde une part d’ouverture : le teaser doit révéler sans épuiser
- termine par une ouverture calme, nette et explicite vers le Cabinet Astraé

STYLE ATTENDU

Le texte doit être :
- sobre
- dense
- nuancé
- incarné
- précis
- élégant
- lisible
- humain
- crédible
- non spectaculaire
- non commercial

Chaque phrase doit apporter quelque chose.
Pas de répétition.
Pas de remplissage.
Pas d’effet littéraire excessif.
Pas de jargon psychologique.
Pas de jargon ésotérique.

FORMAT D’ÉCRITURE

- écrire en français
- écrire en vouvoiement
- entre 120 et 190 mots
- 2 ou 3 paragraphes maximum
- sans titre
- sans puces
- sans sous-titres

CONTRAINTE CRITIQUE DE FIN

Le dernier paragraphe doit impérativement créer une ouverture explicite vers un approfondissement avec le Cabinet Astraé.
Cette ouverture doit :
- mentionner clairement le Cabinet Astraé
- suggérer qu’un échange permettrait d’aller plus loin
- rester sobre, fluide et non commerciale
- prolonger naturellement ce qui vient d’être décrit
- donner envie sans pousser

La fin ne doit pas être générique.
Elle doit être reliée à la dynamique décrite dans le teaser.
Elle ne doit pas simplement dire qu’un échange “pourrait être utile”.
Elle doit faire sentir que mettre des mots plus précis sur cette dynamique permettrait de mieux comprendre ce qui se rejoue.

Si cette ouverture est absente, trop vague, trop froide ou trop générique, la réponse est invalide.

TEST DE QUALITÉ INTERNE AVANT RÉPONSE

N’envoie le teaser que s’il respecte tous ces critères :
- il ne pourrait pas être envoyé tel quel à une autre personne sans paraître faux
- il contient une tension intérieure identifiable
- il contient au moins un comportement ou une posture reconnaissable
- il ne contient aucune formule creuse
- il ne révèle pas la mécanique astrologique
- il se termine par une ouverture explicite vers le Cabinet Astraé
- il donne une impression de reconnaissance, pas de démonstration
- il reste légèrement ouvert : il éclaire sans épuiser

AMORCE CONTEXTUELLE (OBLIGATOIRE)

Le teaser doit donner l’impression qu’il résulte d’un temps d’attention réel.

Sans jamais mentionner explicitement un traitement automatisé, tu peux intégrer de manière naturelle, en début de texte, une formulation suggérant qu’un regard a été porté sur la situation.

Exemples de tonalité attendue (à adapter, ne pas répéter) :
- "En prenant le temps de regarder ce qui ressort de votre profil…"
- "Ce qui apparaît lorsqu’on observe votre manière de fonctionner…"
- "Certains éléments qui se dégagent de votre situation…"

Règles :
- ne pas systématiser une phrase identique (variation obligatoire)
- ne pas alourdir l’introduction
- ne pas utiliser un ton technique ou analytique
- rester fluide, humain, discret

Objectif :
Créer une perception implicite de recul, d’attention et de sérieux.
`.trim();

const TEASER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    teaser: {
      type: "string",
      description:
        "Teaser client Astraé en français, vouvoiement, 120 à 160 mots, 2 à 3 paragraphes maximum."
    }
  },
  required: ["teaser"]
} as const;

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Aucun JSON exploitable trouvé dans la réponse du modèle");
  }

  return raw.slice(start, end + 1);
}

function normalizeTeaser(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function hasExplicitAstraeOpening(text: string): boolean {
  const lowered = text.toLowerCase();

  const mentionsAstrae =
    lowered.includes("cabinet astraé") || lowered.includes("cabinet astrae");

  const mentionsOpening =
    lowered.includes("échange") ||
    lowered.includes("echange") ||
    lowered.includes("approfond") ||
    lowered.includes("aller plus loin") ||
    lowered.includes("explor") ||
    lowered.includes("mettre des mots") ||
    lowered.includes("comprendre plus précisément") ||
    lowered.includes("ce qui se rejoue");

  return mentionsAstrae && mentionsOpening;
}

function buildUserPrompt(params: {
  entryPoint: string;
  firstName: string;
  context: string;
  score: string;
  profile: string;
  astroData: unknown;
}): string {
  const { entryPoint, firstName, context, score, profile, astroData } = params;

  return `
Contexte du lead :
- Point d’entrée : ${entryPoint}
- Prénom : ${firstName || ""}
- Situation connue : ${context || ""}
- Score éventuel : ${score || ""}
- Profil détecté : ${profile || ""}

Données astrologiques structurées :
${JSON.stringify(astroData, null, 2)}

Consignes complémentaires :
- écris pour cette personne précise, jamais pour un profil générique
- n’utilise pas forcément le prénom dans le texte
- privilégie toujours la justesse à l’effet
- si plusieurs dynamiques existent, choisis la plus forte et la plus crédible
- fais apparaître au moins un comportement concret ou une posture reconnaissable
- la fin doit ouvrir explicitement vers un approfondissement avec le Cabinet Astraé
- retourne uniquement le JSON demandé
`.trim();
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

    const userPrompt = buildUserPrompt({
      entryPoint,
      firstName,
      context,
      score,
      profile,
      astroData
    });

    const response = await openai.responses.create({
      model: MODEL,
      temperature: 0.3,
      text: {
        format: {
          type: "json_schema",
          name: "astrae_teaser_response",
          strict: true,
          schema: TEASER_SCHEMA
        }
      },
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: SYSTEM_PROMPT
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

    const teaser = normalizeTeaser(parsed.teaser);

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

    const wordCount = countWords(teaser);

    if (wordCount < 120 || wordCount > 170) {
      return NextResponse.json(
        {
          success: false,
          error: `Le teaser généré ne respecte pas la longueur attendue (${wordCount} mots)`,
          raw: teaser
        },
        { status: 500 }
      );
    }

    if (!hasExplicitAstraeOpening(teaser)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le teaser a été généré, mais la fin n'ouvre pas assez clairement vers le Cabinet Astraé",
          raw: teaser
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
