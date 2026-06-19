import "./config.js"; // charge le .env racine (ANTHROPIC_API_KEY)
import { readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Briefing } from "@watchtower/shared";
import { BRIEFINGS_PATH } from "./data/briefings.js";

/**
 * Ingestion d'un briefing texte de James → Briefing structuré.
 *
 * Usage :
 *   pnpm --filter @watchtower/server run ingest chemin/vers/texte.txt
 *   pbpaste | pnpm --filter @watchtower/server run ingest   (stdin)
 *
 * Nécessite ANTHROPIC_API_KEY dans le .env racine.
 */

const AssetKind = z.enum(["stock", "crypto"]);

const TargetSchema = z.object({
  symbol: z.string().describe("Ticker action (ex: TSLA) ou paire Binance USDT pour la crypto (ex: BTCUSDT)"),
  kind: AssetKind,
  label: z.string().describe("Nom affiché, ex: Tesla, Bitcoin"),
  target: z.number().describe("Prix d'achat cible visé par James"),
  notedPrice: z.number().nullable().describe("Prix indiqué par James au moment du briefing, sinon null"),
  note: z.string().nullable().describe("Commentaire de James sur cette cible, sinon null"),
});

const WatchingSchema = z.object({
  symbol: z.string(),
  kind: AssetKind,
  label: z.string(),
  note: z.string().describe("Pourquoi James surveille cet actif"),
});

const BriefingExtraction = z.object({
  title: z.string().describe("Titre du briefing"),
  date: z.string().describe("Date du briefing au format YYYY-MM-DD, déduite du texte ; sinon chaîne vide"),
  tldr: z.string().describe("Résumé en français de la thèse de James (2-3 phrases)"),
  stance: z.array(z.string()).describe("Points de positionnement (cash, crypto, IA...) en français"),
  macro: z.array(z.string()).describe("Vues macro en français"),
  targets: z.array(TargetSchema).describe("Prix d'achat cibles chiffrés"),
  watching: z.array(WatchingSchema).describe("Actifs surveillés sans cible chiffrée ferme"),
});

const SYSTEM_PROMPT = `Tu structures les briefings d'investissement de James (mentor de Vincent) pour un dashboard.
À partir du texte brut (souvent en anglais), produis un briefing structuré :
- Rédige tldr / stance / macro / notes EN FRANÇAIS, fidèlement, sans inventer de chiffres.
- targets : uniquement les titres avec un prix d'achat cible chiffré explicite.
- watching : les titres juste surveillés, sans cible ferme.
- kind = "crypto" pour les cryptomonnaies (symbol = paire Binance USDT en majuscules, ex: BTCUSDT, ETHUSDT) ; sinon "stock" (symbol = ticker, ex: TSLA, MU, PLTR).
- Si une date est mentionnée, mets-la au format YYYY-MM-DD ; sinon laisse une chaîne vide.
- Ne mets dans notedPrice que le prix explicitement cité par James, sinon null.`;

function readInput(): string {
  const fileArg = process.argv[2];
  const text = fileArg ? readFileSync(fileArg, "utf8") : readFileSync(0, "utf8");
  if (!text.trim()) {
    console.error("Aucun texte fourni (passe un fichier en argument ou via stdin).");
    process.exit(1);
  }
  return text;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const rawText = readInput();

const client = new Anthropic();

console.error("Structuration du briefing via claude-opus-4-8…");
const response = await client.messages.parse({
  model: "claude-opus-4-8",
  max_tokens: 8000,
  thinking: { type: "adaptive" },
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: rawText }],
  output_config: { format: zodOutputFormat(BriefingExtraction) },
});

const parsed = response.parsed_output;
if (!parsed) {
  console.error("Échec : aucune sortie structurée (stop_reason:", response.stop_reason, ")");
  process.exit(1);
}

const date = parsed.date.trim() || new Date().toISOString().slice(0, 10);
const id = `${date}-${slugify(parsed.title)}`;

const briefing: Briefing = {
  id,
  title: parsed.title,
  date,
  tldr: parsed.tldr,
  body: rawText,
  stance: parsed.stance,
  macro: parsed.macro,
  targets: parsed.targets.map((t) => ({
    symbol: t.symbol,
    kind: t.kind,
    label: t.label,
    target: t.target,
    ...(t.notedPrice != null ? { notedPrice: t.notedPrice } : {}),
    ...(t.note ? { note: t.note } : {}),
  })),
  watching: parsed.watching,
};

const existing = JSON.parse(readFileSync(BRIEFINGS_PATH, "utf8")) as Briefing[];
const updated = [briefing, ...existing.filter((b) => b.id !== id)];
writeFileSync(BRIEFINGS_PATH, JSON.stringify(updated, null, 2) + "\n");

console.error(
  `✓ Briefing « ${briefing.title} » (${id}) ajouté : ` +
    `${briefing.targets.length} cible(s), ${briefing.watching.length} surveillé(s).`,
);
console.error("Relance le snapshot puis pousse pour mettre à jour le dashboard.");
