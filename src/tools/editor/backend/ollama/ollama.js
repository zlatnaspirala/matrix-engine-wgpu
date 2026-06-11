import {aiConfig} from "../config.js";
import {Ollama} from "ollama";

export class AiOllama {
  constructor(model) {
    // qwen3.5:27b
    // qwen3.6:35b
    this.model = "gpt-oss:120b";
  }
  async aiGenGraphCall(i) {
    const ollama = new Ollama({
      host: "https://ollama.com",
      headers: {Authorization: "Bearer " + aiConfig.ollama},
    });
    const response = await ollama.chat({
      model: this.model,
      messages: [
        {role: "system", content: i.finalSysPrompt},
        {role: "user", content: i.task}
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