import {aiConfig} from "../config.js";
import {SYSTEM_PROMPT} from "../test-prompt1.js";
import {Ollama} from "ollama";

export class AiOllama {
  constructor() {
    this.USER_PROMPT = `Create me simple multiply two literal number 10 and print results.`
  }
  async aiGenGraphCall() {
    const ollama = new Ollama({
      host: "https://ollama.com",
      headers: {Authorization: "Bearer " + aiConfig.ollama},
    });
    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [
        {role: "system", content: SYSTEM_PROMPT},
        {role: "user", content: this.USER_PROMPT}
      ],
      stream: true,
    });
    let fullText = "";
    for await(const part of response) {
      const chunk = part.message?.content || "";
      fullText += chunk;
      process.stdout.write(chunk);
    }
    return fullText;
  }
}