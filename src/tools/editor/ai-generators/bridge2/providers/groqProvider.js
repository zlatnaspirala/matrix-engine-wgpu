import Groq from "groq-sdk";
import { BaseProvider } from "./baseProvider.js";

export class GroqProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.client = new Groq({ apiKey: config.apiKey });
  }

  async compile({ system, user }) {
    const res = await this.client.chat.completions.create({
      model: "llama-3.1-8b",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    return res.choices[0].message.content;
  }
}
