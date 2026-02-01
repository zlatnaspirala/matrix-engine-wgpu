



const res = await fetch('https://api.ollama.ai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
  },
  body: JSON.stringify({
    model: 'llama3.1:8b',
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Explain WebGPU in one sentence' }
    ]
  })
});

const data = await res.json();
console.log(data.choices[0].message.content);