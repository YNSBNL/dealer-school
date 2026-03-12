"use client";
import Link from "next/link";

export default function AuthWall({ game = "ce simulateur", freeRounds = 3, roundsPlayed = 0 }) {
  const remaining = Math.max(0, freeRounds - roundsPlayed);

  // Banner shown during free rounds
  if (roundsPlayed > 0 && roundsPlayed < freeRounds) {
    return (
      <div style={{
        padding: "8px 16px",
        background: "rgba(201,168,76,0.06)",
        border: "1px solid rgba(201,168,76,0.12)",
        borderRadius: 4,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12,
        marginBottom: 12,
      }}>
        <span style={{ color: "#BFB9AD" }}>
          Mode découverte — <strong style={{ color: "#C9A84C" }}>{remaining} essai{remaining > 1 ? "s" : ""} gratuit{remaining > 1 ? "s" : ""}</strong> restant{remaining > 1 ? "s" : ""}
        </span>
        <Link href="/auth/register" style={{
          padding: "4px 12px",
          background: "rgba(201,168,76,0.1)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: 2,
          color: "#C9A84C",
          fontSize: 11,
          fontWeight: 600,
          textDecoration: "none",
        }}>
          Créer un compte
        </Link>
      </div>
    );
  }

  // Full wall after free rounds used
  if (roundsPlayed >= freeRounds) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,10,10,0.92)",
        backdropFilter: "blur(8px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          maxWidth: 440,
          width: "100%",
          background: "#1A1A1A",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 8,
          padding: "48px 36px",
          textAlign: "center",
          margin: 24,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎰</div>
          
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 24,
            fontWeight: 900,
            marginBottom: 8,
            color: "#F5F0E8",
          }}>
            Vous aimez {game} ?
          </h2>
          
          <p style={{
            fontSize: 14,
            color: "#BFB9AD",
            fontWeight: 300,
            lineHeight: 1.7,
            marginBottom: 28,
          }}>
            Vos {freeRounds} essais gratuits sont terminés. Créez un compte gratuit pour continuer à vous entraîner et suivre votre progression.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/auth/register" style={{
              padding: "14px 32px",
              background: "#C9A84C",
              color: "#0A0A0A",
              borderRadius: 3,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "block",
            }}>
              Créer un compte gratuit
            </Link>
            
            <Link href="/auth/login" style={{
              padding: "12px 32px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#BFB9AD",
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              display: "block",
            }}>
              Déjà un compte ? Se connecter
            </Link>
          </div>

          <div style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 11, color: "#BFB9AD", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Avec un compte vous obtenez :
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#BFB9AD", textAlign: "left" }}>
              {[
                "Entraînement illimité sur tous les simulateurs",
                "Suivi de progression et scores sauvegardés",
                "Coach IA personnel",
                "Parcours de certification Bronze → Elite",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#C9A84C", fontSize: 10 }}>✦</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
