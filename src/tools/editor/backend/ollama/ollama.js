import {aiConfig} from "../config.js";
// import {SYSTEM_PROMPT} from "./test-prompt1.js";
import {Ollama} from "ollama";

export class AiOllama {
  constructor() {}
  async aiGenGraphCall(i) {
    const ollama = new Ollama({
      host: "https://ollama.com",
      headers: {Authorization: "Bearer " + aiConfig.ollama},
    });
    const response = await ollama.chat({
      model: "gpt-oss:120b",
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