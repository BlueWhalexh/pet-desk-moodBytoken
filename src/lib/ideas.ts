import ideas from "../../pets/ideas.json";

export type PetIdea = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  status: "planned" | "hatching" | "imported";
  featured?: boolean;
};

export function getPetIdeas() {
  return ideas as PetIdea[];
}
