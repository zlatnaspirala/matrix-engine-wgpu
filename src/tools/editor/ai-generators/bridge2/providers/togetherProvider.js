// ai/providers/TogetherProvider.js
import Together from "together-ai";
import { BaseProvider } from "./baseProvider.js";

export class TogetherProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.client = new Together({ apiKey: config.apiKey });
  }

  async compile({ system, user }) {
    const res = await this.client.chat.completions.create({
      model: "meta-llama/Llama-3-8b-chat-hf",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    });

    return res.choices[0].message.content;
  }
}
