import {aiConfig} from "./config.js";
import {SYSTEM_PROMPT} from "./test-prompt1.js";
import {Ollama} from "ollama";

export class AiOllama {

  constructor() {
    this.USER_PROMPT = `Create me simple print literal number 10.`
  }

  async test() {
    const ollama = new Ollama({
      host: "https://ollama.com",
      headers: {
        Authorization: "Bearer " + aiConfig.ollama,
      },
    });

    const response = await ollama.chat({
      model: "gpt-oss:120b",
      messages: [
        {role: "system", content: SYSTEM_PROMPT},
        {role: "user", content: this.USER_PROMPT}
      ],
      stream: true,
    });

    for await(const part of response) {
      process.stdout.write(part.message.content);
    }

  }
}
