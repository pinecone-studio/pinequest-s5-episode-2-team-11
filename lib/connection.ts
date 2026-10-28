/** «Ярилцмаар байна» topics (optional). */
export const TALK_TOPICS: [string, string][] = [["body", "Бие маань"], ["friends", "Найзууд"], ["school", "Сургууль"], ["just", "Зүгээр л"]];
export const topicLabel = (topic: string | null | undefined) => TALK_TOPICS.find(([id]) => id === topic)?.[1] ?? null;
