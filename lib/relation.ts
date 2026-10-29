/** Relation word for a guardian. The app no longer asks for gender, so it is always neutral. */
export const GUARDIAN_RELATION = "Асран хамгаалагч";

// Mongolian case endings follow vowel harmony, so they are spelled out per word.
const GENITIVE: Record<string, string> = { Ээж: "Ээжийн", Аав: "Аавын", "Асран хамгаалагч": "Асран хамгаалагчийн" };
const WITH: Record<string, string> = { Ээж: "Ээжтэйгээ", Аав: "Аавтайгаа", "Асран хамгаалагч": "Асран хамгаалагчтайгаа" };
/** "Ээжийн түүх" */
export const relationOf = (relation: string) => GENITIVE[relation] ?? `${relation}ийн`;
/** "Ээжтэйгээ ярих уу?" */
export const relationWith = (relation: string) => WITH[relation] ?? `${relation}тэйгээ`;
