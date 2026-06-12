import {aiConfig} from "../config.js";
import {GoogleGenerativeAI} from "@google/generative-ai";

export class AiGoogleStudio {
  constructor(model) {
    this.model = model || "gemini-2.5-flash";
  }

  async aiGenGraphCall(i) {
    const genAI = new GoogleGenerativeAI(aiConfig.google);
    console.log('AiGoogleStudio cloud called...')
    const model = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: i.finalSysPrompt,
    });

    const result = await model.generateContentStream(i.task);

    let fullText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      process.stdout.write(text);
    }

    return fullText;
  }
}