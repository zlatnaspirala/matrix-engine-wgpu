import {aiConfig} from "../config.js";
import {Ollama} from "ollama";

export class AiOllama {
  constructor(model) {
    // qwen3.5:27b
    // qwen3.6:35b
    this.model = "gemma4:31b-cloud";
    // devstral-small-2
    // this.model = "gpt-oss:120b";
    this.stream = false;
  }
  async aiGenGraphCall(i) {
    const ollama = new Ollama({
      host: "https://ollama.com",
      headers: {Authorization: "Bearer " + aiConfig.ollama},
    });
    console.log('Ollama cloud called...')
    const response = await ollama.chat({
      model: this.model,
      messages: [
        {role: "system", content: i.finalSysPrompt},
        {role: "user", content: i.task}
      ],
      stream: false,
    });
    let fullText = "";
    if(this.stream === true) {
      for await(const part of response) {
        const chunk = part.message?.content || "";
        fullText += chunk;
        process.stdout.write(chunk);
      }
    } else {
      fullText = response.message?.content || "";
    }
    return fullText;
  }
}