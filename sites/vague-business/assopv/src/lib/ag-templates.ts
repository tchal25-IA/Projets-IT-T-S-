import type { AGData, AgendaItem, Attendee } from "./ag-store";

function fmtDate(iso: string, locale: "fr-CH" | "de-CH") {
  if (!iso) return "________________";
  try {
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function totalVoix(atts: Attendee[]) {
  return atts.reduce((s, a) => s + (Number(a.voix) || 0), 0);
}

function voteResult(v: AgendaItem["vote"], lang: "fr" | "de") {
  const adopted = v.pour > v.contre;
  if (lang === "fr") return adopted ? "adopté" : "rejeté";
  return adopted ? "angenommen" : "abgelehnt";
}

// ============ FR ============
export function convocationFR(d: AGData) {
  const typeLabel = d.agType === "ordinaire" ? "ordinaire" : "extraordinaire";
  return `
${d.assoName || "[Nom de l'association]"}
${d.siege || "[Siège]"}${d.canton ? ` (${d.canton})` : ""}

Le ${fmtDate(d.convocationDate, "fr-CH")}

Convocation à l'assemblée générale ${typeLabel}

Chères membres, chers membres,

${d.convocationIntro}

L'assemblée générale ${typeLabel} se tiendra le ${fmtDate(d.agDate, "fr-CH")} à ${d.agTime || "__h__"}, à ${d.agLieu || "[lieu]"}.

L'ordre du jour figure en annexe de la présente convocation. Nous vous prions de bien vouloir y prendre part et vous remercions par avance de votre engagement.

En cas d'empêchement, merci de bien vouloir en informer le secrétariat.

Avec nos salutations les meilleures,

${d.signPresident || "[Président·e]"}                    ${d.signSecretaire || "[Secrétaire]"}
Président·e                                              Secrétaire
`.trim();
}

export function convocationDE(d: AGData) {
  const typeLabel = d.agType === "ordinaire" ? "ordentliche" : "ausserordentliche";
  return `
${d.assoName || "[Vereinsname]"}
${d.siege || "[Sitz]"}${d.canton ? ` (${d.canton})` : ""}

${fmtDate(d.convocationDate, "de-CH")}

Einladung zur ${typeLabel}n Generalversammlung

Liebe Mitglieder,

${d.convocationIntro}

Die ${typeLabel} Generalversammlung findet am ${fmtDate(d.agDate, "de-CH")} um ${d.agTime || "__:__"} Uhr in ${d.agLieu || "[Ort]"} statt.

Die Traktandenliste ist beigefügt. Wir freuen uns auf Ihre Teilnahme und danken für Ihr Engagement.

Bei Verhinderung bitten wir um kurze Mitteilung ans Sekretariat.

Freundliche Grüsse,

${d.signPresident || "[Präsident/in]"}                    ${d.signSecretaire || "[Sekretär/in]"}
Präsident/in                                              Sekretär/in
`.trim();
}

export function agendaFR(d: AGData) {
  return d.agenda.map((it, i) => `${i + 1}. ${it.title}`).join("\n");
}
export function agendaDE(d: AGData) {
  return d.agenda.map((it, i) => `${i + 1}. ${it.title}`).join("\n");
}

export function presenceFR(d: AGData) {
  const rows = d.attendees.length
    ? d.attendees.map((a, i) => `${String(i + 1).padStart(2, "0")}.  ${a.name.padEnd(40, " ")}  voix : ${a.voix}`).join("\n")
    : "[Liste des membres présents à compléter]";
  return `Liste de présence — ${d.assoName || "[Association]"}
AG du ${fmtDate(d.agDate, "fr-CH")} — ${d.agLieu}

${rows}

Nombre de membres présents : ${d.attendees.length}
Total des voix représentées : ${totalVoix(d.attendees)}
${d.quorumNote}`;
}
export function presenceDE(d: AGData) {
  const rows = d.attendees.length
    ? d.attendees.map((a, i) => `${String(i + 1).padStart(2, "0")}.  ${a.name.padEnd(40, " ")}  Stimmen: ${a.voix}`).join("\n")
    : "[Anwesenheitsliste ausfüllen]";
  return `Anwesenheitsliste — ${d.assoName || "[Verein]"}
GV vom ${fmtDate(d.agDate, "de-CH")} — ${d.agLieu}

${rows}

Anzahl anwesende Mitglieder: ${d.attendees.length}
Total vertretene Stimmen: ${totalVoix(d.attendees)}
${d.quorumNote}`;
}

export function pvFR(d: AGData) {
  const header = `Procès-verbal
Assemblée générale ${d.agType} — ${d.assoName || "[Association]"}
${fmtDate(d.agDate, "fr-CH")} — ${d.agLieu}

Président·e de séance : ${d.signPresident || "________"}
Secrétaire : ${d.signSecretaire || "________"}
Membres présents : ${d.attendees.length}   Voix : ${totalVoix(d.attendees)}
${d.quorumNote}
`;
  const body = d.agenda.map((it, i) => {
    const lines = [`${i + 1}. ${it.title}`, it.notes || "[Décisions et discussion]"];
    if (it.hasVote) {
      lines.push(`Vote — Pour : ${it.vote.pour}  Contre : ${it.vote.contre}  Abstention : ${it.vote.abstention}  → ${voteResult(it.vote, "fr")}`);
    }
    return lines.join("\n");
  }).join("\n\n");
  const footer = `\n\nLa séance est levée à ____h____.

Fait à ${d.pvClosingLieu || d.agLieu || "________"}, le ${fmtDate(d.pvClosingDate || d.agDate, "fr-CH")}.

${d.signPresident || "[Président·e]"}                    ${d.signSecretaire || "[Secrétaire]"}
Président·e                                              Secrétaire`;
  return header + "\n" + body + footer;
}

export function pvDE(d: AGData) {
  const header = `Protokoll
${d.agType === "ordinaire" ? "Ordentliche" : "Ausserordentliche"} Generalversammlung — ${d.assoName || "[Verein]"}
${fmtDate(d.agDate, "de-CH")} — ${d.agLieu}

Vorsitz: ${d.signPresident || "________"}
Protokoll: ${d.signSecretaire || "________"}
Anwesende Mitglieder: ${d.attendees.length}   Stimmen: ${totalVoix(d.attendees)}
${d.quorumNote}
`;
  const body = d.agenda.map((it, i) => {
    const lines = [`${i + 1}. ${it.title}`, it.notes || "[Beschlüsse und Diskussion]"];
    if (it.hasVote) {
      lines.push(`Abstimmung — Ja: ${it.vote.pour}  Nein: ${it.vote.contre}  Enthaltung: ${it.vote.abstention}  → ${voteResult(it.vote, "de")}`);
    }
    return lines.join("\n");
  }).join("\n\n");
  const footer = `\n\nSchluss der Versammlung um ____:____ Uhr.

${d.pvClosingLieu || d.agLieu || "________"}, ${fmtDate(d.pvClosingDate || d.agDate, "de-CH")}.

${d.signPresident || "[Präsident/in]"}                    ${d.signSecretaire || "[Sekretär/in]"}
Präsident/in                                              Sekretär/in`;
  return header + "\n" + body + footer;
}
