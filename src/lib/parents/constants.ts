export const parentRelations = ["Baba", "Anne", "Vasi", "Abi", "Diger"] as const;

export type ParentRelation = (typeof parentRelations)[number];

export const parentRelationLabels: Record<ParentRelation, string> = {
  Baba: "Baba",
  Anne: "Anne",
  Vasi: "Vasi",
  Abi: "Abi",
  Diger: "Diğer",
};
