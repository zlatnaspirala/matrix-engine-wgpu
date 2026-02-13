import { aiConfig } from "../config.js";
import { SYSTEM_PROMPT } from "../ollama/test-prompt1.js";
import Groq from "groq-sdk";

export class AiGroq {
  constructor() {
    this.USER_PROMPT =
      "Create me simple multiply two literal number 10 and print results.";
  }

  async aiGenGraphCall(i) {
    const groq = new Groq({
      apiKey: aiConfig.groq
    });
    const response = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: i }
      ],
      temperature: 0.2,
      stream: true
    });
    for await (const chunk of response) {
      process.stdout.write(
        chunk.choices?.[0]?.delta?.content || ""
      );
    }
  }
}