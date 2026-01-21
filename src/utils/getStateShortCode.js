import { STATE_CODES } from "./stateCodes";

export const getStateShortCode = (stateName, country) => {
  if (!stateName) return "";

  const states = STATE_CODES[country];
  if (!states) return stateName;

  const key = Object.keys(states).find(
    s => s.toLowerCase().trim() === stateName.toLowerCase().trim()
  );

  return key ? states[key] : stateName;
};
