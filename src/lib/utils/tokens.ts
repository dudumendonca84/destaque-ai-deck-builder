import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const make = customAlphabet(alphabet, 16);

export function newProposalToken(): string {
  return make();
}
