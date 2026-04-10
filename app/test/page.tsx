"use client";

import { useState } from "react";

type CalculateResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

type FicheInterne = {
  dynamiqueCentrale?: string;
  tensionInterieure?: string;
  rapportAuxRelations?: string;
  ressources?: string[];
  vigilances?: string[];
  axesDeSeance?: string[];
  questions?: string[];
};

type InterpretResponse = {
  success: boolean;
  data?: {
    teaser?: string;
    ficheInterne?: FicheInterne;
  };
  error?: string;
  raw?: string;
};

function SectionCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "24px",
        backdropFilter: "blur(8px)"
      }}
    >
      <h2
        style={{
          margin: "0 0 18px 0",
          fontSize: "20px",
          fontWeight: 600,
          color: "#f5f1e8"
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) {
    return <p style={{ margin: 0, opacity: 0.7 }}>Aucune donnée</p>;
  }

  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: "20px",
        lineHeight: 1.7,
        color: "#e8e1d4"
      }}
    >
      {items.map((item, index) => (
        <li key={`${item}-${index}`} style={{ marginBottom: "8px" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function TestPage() {
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [loadingInterpret, setLoadingInterpret] = useState(false);

  const [calcResult, setCalcResult] = useState<CalculateResponse | null>(null);
  const [interpretResult, setInterpretResult] =
    useState<InterpretResponse | null>(null);

  async function handleCalculate() {
    try {
      setLoadingCalc(true);
      setCalcResult(null);
      setInterpretResult(null);

      const response = await fetch("/api/astro/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          birthDate: "1974-08-03",
          birthTime: "16:30",
          birthPlace: "Bayeux",
          timezoneOffset: 2
        })
      });

      const data = await response.json();
      setCalcResult(data);
    } catch (error) {
      console.error("Erreur calcul :", error);

      setCalcResult({
        success: false,
        error: "Erreur pendant le calcul"
      });
    } finally {
      setLoadingCalc(false);
    }
  }

  async function handleInterpret() {
    try {
      if (!calcResult?.success || !calcResult.data) {
        setInterpretResult({
          success: false,
          error: "Calcule d'abord le thème"
        });
        return;
      }

      setLoadingInterpret(true);
      setInterpretResult(null);

      const response = await fetch("/api/astro/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          astroData: calcResult.data
        })
      });

      const data = await response.json();
      setInterpretResult(data);
    } catch (error) {
      console.error("Erreur interprétation :", error);

      setInterpretResult({
        success: false,
        error: "Erreur pendant l'interprétation"
      });
    } finally {
      setLoadingInterpret(false);
    }
  }

  const teaser = interpretResult?.data?.teaser;
  const fiche = interpretResult?.data?.ficheInterne;
  const summary = calcResult?.data?.summary;
  const identity = calcResult?.data?.identity;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(92,122,92,0.20), transparent 35%), #060606",
        color: "#f8f6f1",
        fontFamily: "Arial, sans-serif",
        padding: "40px 20px"
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto"
        }}
      >
        <header
          style={{
            marginBottom: "32px",
            textAlign: "center"
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#aab7a1",
              fontSize: "12px",
              letterSpacing: "0.22em",
              textTransform: "uppercase"
            }}
          >
            Astraé • Test interne
          </p>

          <h1
            style={{
              margin: "14px 0 10px 0",
              fontSize: "34px",
              lineHeight: 1.2,
              fontWeight: 600
            }}
          >
            Moteur astrologique + interprétation
          </h1>

          <p
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              color: "#d2ccbf",
              fontSize: "16px",
              lineHeight: 1.7
            }}
          >
            Cette page permet de valider le calcul du thème puis la génération
            automatique d’une première lecture Astraé, avec teaser client et
            fiche interne.
          </p>
        </header>

        <div
          style={{
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: "36px"
          }}
        >
          <button
            onClick={handleCalculate}
            disabled={loadingCalc}
            style={{
              padding: "14px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(168,191,163,0.35)",
              background: loadingCalc ? "#2f3a2f" : "#5f7d5f",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loadingCalc ? "not-allowed" : "pointer",
              opacity: loadingCalc ? 0.75 : 1
            }}
          >
            {loadingCalc ? "Calcul en cours..." : "1. Calculer le thème"}
          </button>

          <button
            onClick={handleInterpret}
            disabled={loadingInterpret || !calcResult?.success}
            style={{
              padding: "14px 22px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.14)",
              background:
                loadingInterpret || !calcResult?.success
                  ? "#252525"
                  : "#111111",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              cursor:
                loadingInterpret || !calcResult?.success
                  ? "not-allowed"
                  : "pointer",
              opacity: loadingInterpret || !calcResult?.success ? 0.7 : 1
            }}
          >
            {loadingInterpret
              ? "Interprétation en cours..."
              : "2. Générer l’interprétation"}
          </button>
        </div>

        {calcResult?.success && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginBottom: "28px"
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "18px"
              }}
            >
              <p style={{ margin: "0 0 8px 0", color: "#aab7a1", fontSize: 13 }}>
                Date de naissance
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {identity?.birthDate || "—"}
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "18px"
              }}
            >
              <p style={{ margin: "0 0 8px 0", color: "#aab7a1", fontSize: 13 }}>
                Heure
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {identity?.birthTime || "—"}
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "18px"
              }}
            >
              <p style={{ margin: "0 0 8px 0", color: "#aab7a1", fontSize: 13 }}>
                Lieu
              </p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                {identity?.birthPlace || "—"}
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "18px"
              }}
            >
              <p style={{ margin: "0 0 8px 0", color: "#aab7a1", fontSize: 13 }}>
                Repères calculés
              </p>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}>
                Soleil : <strong>{summary?.sun || "—"}</strong>
                <br />
                Lune : <strong>{summary?.moon || "—"}</strong>
                <br />
                Ascendant : <strong>{summary?.ascendant || "—"}</strong>
                <br />
                MC : <strong>{summary?.mc || "—"}</strong>
              </p>
            </div>
          </div>
        )}

        {teaser && (
          <SectionCard title="Teaser client">
            <div
              style={{
                color: "#f1eadc",
                lineHeight: 1.9,
                fontSize: "16px",
                whiteSpace: "pre-wrap"
              }}
            >
              {teaser}
            </div>
          </SectionCard>
        )}

        {fiche && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "18px",
              marginTop: teaser ? "24px" : 0
            }}
          >
            <SectionCard title="Fiche interne Astraé — Dynamique centrale">
              <p
                style={{
                  margin: 0,
                  color: "#e8e1d4",
                  lineHeight: 1.8
                }}
              >
                {fiche.dynamiqueCentrale || "Aucune donnée"}
              </p>
            </SectionCard>

            <SectionCard title="Tension intérieure">
              <p
                style={{
                  margin: 0,
                  color: "#e8e1d4",
                  lineHeight: 1.8
                }}
              >
                {fiche.tensionInterieure || "Aucune donnée"}
              </p>
            </SectionCard>

            <SectionCard title="Rapport aux relations">
              <p
                style={{
                  margin: 0,
                  color: "#e8e1d4",
                  lineHeight: 1.8
                }}
              >
                {fiche.rapportAuxRelations || "Aucune donnée"}
              </p>
            </SectionCard>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "18px"
              }}
            >
              <SectionCard title="Ressources">
                <BulletList items={fiche.ressources} />
              </SectionCard>

              <SectionCard title="Vigilances">
                <BulletList items={fiche.vigilances} />
              </SectionCard>

              <SectionCard title="Axes de séance">
                <BulletList items={fiche.axesDeSeance} />
              </SectionCard>

              <SectionCard title="Questions d’exploration">
                <BulletList items={fiche.questions} />
              </SectionCard>
            </div>
          </div>
        )}

        {calcResult && !calcResult.success && (
          <section
            style={{
              marginTop: "28px",
              background: "rgba(255, 107, 107, 0.08)",
              border: "1px solid rgba(255, 107, 107, 0.25)",
              borderRadius: "16px",
              padding: "20px"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Erreur calcul</h2>
            <p style={{ marginBottom: 0 }}>{calcResult.error}</p>
          </section>
        )}

        {interpretResult && !interpretResult.success && (
          <section
            style={{
              marginTop: "28px",
              background: "rgba(255, 107, 107, 0.08)",
              border: "1px solid rgba(255, 107, 107, 0.25)",
              borderRadius: "16px",
              padding: "20px"
            }}
          >
            <h2 style={{ marginTop: 0 }}>Erreur interprétation</h2>
            <p>{interpretResult.error}</p>

            {interpretResult.raw && (
              <pre
                style={{
                  marginTop: "16px",
                  background: "#111",
                  color: "#ffd166",
                  padding: "16px",
                  borderRadius: "12px",
                  overflowX: "auto",
                  whiteSpace: "pre-wrap"
                }}
              >
                {interpretResult.raw}
              </pre>
            )}
          </section>
        )}

        {calcResult?.success && (
          <details
            style={{
              marginTop: "28px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "16px 18px"
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "#cfc7b8"
              }}
            >
              Voir les données techniques
            </summary>

            <pre
              style={{
                marginTop: "16px",
                background: "#0d0d0d",
                color: "#8dffb1",
                padding: "16px",
                borderRadius: "12px",
                overflowX: "auto",
                whiteSpace: "pre-wrap"
              }}
            >
              {JSON.stringify(calcResult.data, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}