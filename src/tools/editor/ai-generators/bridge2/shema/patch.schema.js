
export const PATCH_SCHEMA = {
  type: "object",
  required: ["confidence", "ops"],
  properties: {
    confidence: { type: "number", minimum: 0, maximum: 1 },
    ops: {
      type: "array",
      items: {
        type: "object",
        required: ["op"],
        properties: {
          op: {
            type: "string",
            enum: [
              "addNode",
              "connect",
              "setField",
              "findNode"
            ]
          },
          type: { type: "string" },
          fields: { type: "object" },
          from: {
            type: "object",
            properties: {
              node: { type: "string" },
              pin: { type: "string" }
            }
          },
          to: {
            type: "object",
            properties: {
              node: { type: "string" },
              pin: { type: "string" }
            }
          }
        },
        additionalProperties: false
      }
    }
  },
  additionalProperties: false
};
