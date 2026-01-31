
// Task	Model
// Fast code / boilerplate	Mistral (local)
// Shader WGSL	LLaMA3 (local)
// Node graph generation	LLaMA3 (local)
// Error explanation	Mistral (local)
// Complex design / planning	OpenAI (remote)

const LLM_TASK = {
      FAST_CODE: "fast_code",
      SHADER_GEN: "shader_gen",
      GRAPH_GEN: "graph_gen",
      EXPLAIN_ERROR: "explain_error",
      COMPLEX_REASONING: "complex_reasoning"
    };

export class ME_AI_TOOL {

  constructor() {
    //
  }

  async test() {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        model: "llama3",
        prompt: "Explain WebGPU in one paragraph",
        stream: false
      })
    });

    const data = await response.json();
    console.log(data.response);
  }

}