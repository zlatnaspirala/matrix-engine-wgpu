// ai/validatePatch.js
import Ajv from "ajv";
import { PATCH_SCHEMA } from "./schema/patch.schema.js";

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(PATCH_SCHEMA);

export function validatePatch(patch) {
  const ok = validate(patch);
  if (!ok) {
    throw new Error("Invalid AI patch: " + ajv.errorsText(validate.errors));
  }
  return patch;
}
