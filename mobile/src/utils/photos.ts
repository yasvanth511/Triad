import { API_URL } from "../constants";

const BASE_URL = API_URL.replace("/api", "");

export function buildPhotoUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
