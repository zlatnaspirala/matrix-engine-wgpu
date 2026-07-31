import Anthropic from "@anthropic-ai/sdk";
import {aiConfig} from "../config.js";

export class AiAnthropic {
  constructor() {
    this.model = "claude-haiku-4-5-20251001"; // fast + cheap
    // this.model = "claude-sonnet-4-6";      // more capable
  }

  async aiGenGraphCall(i) {
    const client = new Anthropic({
      apiKey: aiConfig.anthropic
    });

    const response = await client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: i.finalSysPrompt,
      messages: [
        {role: "user", content: i.task}
      ],
      temperature: 0.2,
      stream: true
    });

    let fullText = "";
    for await (const chunk of response) {
      if (chunk.type === "content_block_delta" &&
          chunk.delta?.type === "text_delta") {
        const text = chunk.delta.text;
        fullText += text;
        process.stdout.write(text);
      }
    }
    return fullText;
  }
}