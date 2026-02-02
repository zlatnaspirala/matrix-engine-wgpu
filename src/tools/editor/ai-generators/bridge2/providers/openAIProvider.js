import OpenAI from "openai";
import { BaseProvider } from "./baseProvider.js";

export class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async compile({ system, user }) {
    const res = await this.client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    return res.choices[0].message.content;
  }
}
