/**
 * AI feature toggles per entity.
 * Set to true to show "Foto scannen" button in the create/edit dialog.
 * The agent can change these values — all other AI files are pre-generated.
 */

export const AI_PHOTO_SCAN: Record<string, boolean> = {
  Mitarbeitende: true,
  Vorhaben: true,
  Quellen: true,
  Anforderungen: true,
  Klaerungspunkte: true,
  Risiken: true,
  Aufgaben: true,
  Entscheidungen: true,
  Kommunikation: true,
  Erfahrungen: true,
  Ergebnisdokumente: true,
};

/**
 * Extract GPS coordinates from photo EXIF metadata and use them
 * to provide location context (reverse geocoding) to the AI extraction
 * and to auto-populate geo fields.
 */
export const AI_PHOTO_LOCATION: Record<string, boolean> = {
  Mitarbeitende: true,
  Vorhaben: true,
  Quellen: true,
  Anforderungen: true,
  Klaerungspunkte: true,
  Risiken: true,
  Aufgaben: true,
  Entscheidungen: true,
  Kommunikation: true,
  Erfahrungen: true,
  Ergebnisdokumente: true,
};