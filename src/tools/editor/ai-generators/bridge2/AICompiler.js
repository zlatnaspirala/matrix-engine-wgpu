import {GroqProvider} from "./providers/groqProvider.js";
import {OpenAIProvider} from "./providers/openAIProvider.js";
import {GeminiProvider} from "./providers/GeminiProvider.js";
import {SYSTEM_MIN} from "./prompts/system.min.js";
import {aiConfig} from "./config.js";

export class AICompiler {
  constructor(config) {
    this.providers = {
      groq: new GroqProvider(config.groq),
      openai: new OpenAIProvider(config.openai),
      gemini: new GeminiProvider(config.gemini)
    };

    this.primary = config.primary || "groq";
    this.fallback = config.fallback || "openai";
  }

  async run(userPrompt) {
    let result = await this.providers[this.primary]
      .compile({system: SYSTEM_MIN, user: userPrompt});

    let json;
    try {
      json = JSON.parse(result);
    } catch {
      json = {confidence: 0};
    }

    if(json.confidence !== undefined && json.confidence < 0.7) {
      result = await this.providers[this.fallback]
        .compile({system: SYSTEM_MIN, user: userPrompt});
    }

    return JSON.parse(result);
  }
}


const compiler = new AICompiler({
  primary: "groq",
  fallback: "openai",
  providers: {
    groq: {apiKey: aiConfig.qrok},
    openai: {apiKey: aiConfig.openai},
    gemini: {apiKey: aiConfig.gemini},
    together: new TogetherProvider({apiKey: process.env.TOGETHER_API_KEY})
  }
});

const patch = await compiler.run(`
NODE FABRIC:
${JSON.stringify(nodeFabric)}

GRAPH SNAPSHOT:
${JSON.stringify(graph)}

USER REQUEST:
"After pyramid generation completes, set DINAMIC_OBJS_READY true"
`);