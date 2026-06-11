import {aiConfig} from "../config.js";
import Groq from "groq-sdk";

export class AiGroq {
  constructor(model) {
    this.model = "llama-3.1-70b-versatile";
  }

  async aiGenGraphCall(i) {
    const groq = new Groq({
      apiKey: aiConfig.groq
    });
    const response = await groq.chat.completions.create({
      model: this.model,
      messages: [
        {role: "system", content: i.finalSysPrompt},
        {role: "user", content: i.task}
      ],
      temperature: 0.2,
      stream: true
    });
    for await(const chunk of response) {
      process.stdout.write(
        chunk.choices?.[0]?.delta?.content || ""
      );
    }
  }
}