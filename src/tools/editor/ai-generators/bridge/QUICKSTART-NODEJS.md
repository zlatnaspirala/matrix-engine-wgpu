# ⚡ Quick Start Guide - Node.js/TypeScript

## 🎯 What Is This?

Convert natural language descriptions into structured graph nodes using AI - all in Node.js/TypeScript!

## 🚀 Installation (30 seconds)

```bash
# Create new project
mkdir my-graph-project
cd my-graph-project

# Initialize npm
npm init -y

# Install dependencies
npm install axios
npm install --save-dev typescript @types/node ts-node

# Copy the bridge file (nl-to-graph-bridge.ts)
```

## 💡 Your First Graph (2 minutes)

### TypeScript

Create `index.ts`:

```typescript
import { NaturalLanguageToGraphBridge, ClaudeAIModel } from './nl-to-graph-bridge';

async function main() {
  // 1. Initialize the bridge
  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);
  
  // 2. Describe what you want
  const description = `
    Create a user login system:
    1. User enters username and password
    2. System checks if credentials are valid
    3. If valid, grant access to dashboard
    4. If invalid, show error message
  `;
  
  // 3. Generate the graph!
  const result = await bridge.process(description);
  
  // 4. See what you got
  console.log(`Created ${result.nodes.length} nodes!`);
  console.log(`Created ${result.edges.length} connections!`);
  
  // Save to file
  const fs = require('fs');
  fs.writeFileSync('my_login_flow.json', bridge.exportToJSON(result));
  console.log('Saved to my_login_flow.json!');
}

main().catch(console.error);
```

Run it:
```bash
npx ts-node index.ts
```

### JavaScript (No TypeScript)

Create `index.js`:

```javascript
const { NaturalLanguageToGraphBridge, ClaudeAIModel } = require('./nl-to-graph-bridge');
const fs = require('fs');

async function main() {
  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);
  
  const description = 'Create a user login system with validation';
  const result = await bridge.process(description);
  
  console.log(`Nodes: ${result.nodes.length}`);
  console.log(`Edges: ${result.edges.length}`);
  
  fs.writeFileSync('output.json', bridge.exportToJSON(result));
}

main();
```

Run it:
```bash
node index.js
```

## 📊 What You Get

```json
{
  "nodes": [
    {
      "id": "input_credentials",
      "type": "data",
      "label": "Enter Username & Password",
      "properties": {
        "fields": ["username", "password"]
      },
      "metadata": {}
    },
    {
      "id": "validate_credentials",
      "type": "process",
      "label": "Validate Credentials",
      "properties": {},
      "metadata": {}
    }
  ],
  "edges": [
    {
      "source": "input_credentials",
      "target": "validate_credentials",
      "label": "submit",
      "properties": {}
    }
  ]
}
```

## 🔥 Common Use Cases

### Use Case 1: API Flow Documentation

```typescript
const description = `
  API endpoint for user registration:
  1. Receive POST request with user data
  2. Validate email format
  3. Check if email already exists
  4. Hash the password
  5. Save user to database
  6. Send verification email
  7. Return success response
`;

const result = await bridge.process(description);
```

### Use Case 2: Express.js Endpoint

```typescript
import express from 'express';
import { NaturalLanguageToGraphBridge, ClaudeAIModel } from './nl-to-graph-bridge';

const app = express();
app.use(express.json());

const aiModel = new ClaudeAIModel();
const bridge = new NaturalLanguageToGraphBridge(aiModel);

app.post('/api/generate-graph', async (req, res) => {
  try {
    const { description, context } = req.body;
    const result = await bridge.process(description, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Use Case 3: Batch Processing

```typescript
const descriptions = [
  'Create a password reset flow',
  'Design an email verification system',
  'Build a two-factor authentication process'
];

const results = await bridge.processBatch(descriptions);

results.forEach((result, i) => {
  console.log(`Flow ${i + 1}: ${result.nodes.length} nodes`);
});
```

## 🎨 Export Formats

### JSON Export

```typescript
import * as fs from 'fs';

const result = await bridge.process('Create a checkout flow');
const json = bridge.exportToJSON(result);
fs.writeFileSync('checkout.json', json);
```

### Graphviz Export

```typescript
const dot = bridge.exportToGraphviz(result);
fs.writeFileSync('checkout.dot', dot);

// Convert to PNG (requires Graphviz installed)
// dot -Tpng checkout.dot -o checkout.png
```

## 🔧 Context for Better Results

```typescript
const context = {
  domain: 'e-commerce',
  user_roles: ['customer', 'admin'],
  existing_systems: ['payment_gateway', 'inventory_db'],
  security_level: 'high'
};

const result = await bridge.process(
  'Create an order placement workflow',
  context
);
```

## 📈 Statistics

```typescript
// After processing some graphs
const stats = bridge.getStatistics();

console.log(`Total queries: ${stats.total_queries}`);
console.log(`Total nodes: ${stats.total_nodes_created}`);
console.log(`Total edges: ${stats.total_edges_created}`);
console.log(`Avg nodes/query: ${stats.avg_nodes_per_query.toFixed(1)}`);
```

## 🎨 Custom Node Factory

```typescript
import { NodeFactory, GraphNode } from './nl-to-graph-bridge';

class MyCustomFactory extends NodeFactory {
  createNode(nodeData: Partial<GraphNode>): GraphNode {
    return {
      id: nodeData.id || this.generateId(),
      type: nodeData.type || 'process',
      label: nodeData.label || 'Unnamed',
      properties: {
        ...nodeData.properties,
        created_at: new Date().toISOString(),
        version: '1.0'
      },
      metadata: nodeData.metadata || {}
    };
  }

  getSchema() {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        label: { type: 'string' }
      }
    };
  }
}

// Use it
const factory = new MyCustomFactory();
const bridge = new NaturalLanguageToGraphBridge(aiModel, factory);
```

## 🤖 Use OpenAI Instead

```typescript
import { OpenAIModel } from './nl-to-graph-bridge';

const apiKey = process.env.OPENAI_API_KEY;
const aiModel = new OpenAIModel(apiKey, 'gpt-4');
const bridge = new NaturalLanguageToGraphBridge(aiModel);

const result = await bridge.process('Create a workflow');
```

## 🚨 Error Handling

```typescript
try {
  const result = await bridge.process('Create a complex workflow');
  console.log('✅ Success!');
} catch (error) {
  console.error('❌ Error:', error.message);
  // Handle gracefully
}
```

## 📦 Project Structure

```
my-project/
├── package.json
├── tsconfig.json
├── nl-to-graph-bridge.ts    # Main bridge
├── examples.ts              # Usage examples
├── index.ts                 # Your code
└── dist/                    # Compiled output
```

## 🛠️ TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

## 🎯 Real-World Examples

### Example 1: E-commerce Checkout

```typescript
const description = `
  Complete e-commerce checkout process:
  1. Customer reviews cart items
  2. Customer enters shipping address
  3. System calculates shipping cost
  4. Customer selects payment method
  5. System processes payment
  6. If successful: create order, send confirmation, update inventory
  7. If failed: show error, allow retry
  8. Redirect to confirmation page
`;

const result = await bridge.process(description);
console.log(`Generated ${result.nodes.length} nodes`);
```

### Example 2: Microservices Architecture

```typescript
const description = `
  Microservices flow for user service:
  1. API Gateway receives request
  2. Authenticate with Auth Service
  3. If authenticated:
     - Query User Service
     - Query Profile Service
     - Aggregate data
     - Cache in Redis
  4. If not authenticated: return 401
  5. Return response
  6. Log to Analytics Service
`;

const context = {
  domain: 'microservices',
  services: ['api-gateway', 'auth', 'user', 'profile', 'analytics'],
  cache: 'redis'
};

const result = await bridge.process(description, context);
```

## ⚡ Performance Tips

- Use batch processing for multiple flows
- Process asynchronously for better performance
- Export to files immediately to save memory
- Clear history periodically if processing many graphs

## 🎉 You're Ready!

### Quick Commands

```bash
# Install
npm install axios typescript @types/node ts-node

# Run TypeScript
npx ts-node index.ts

# Build
npx tsc

# Run compiled
node dist/index.js
```

### Basic Template

```typescript
import { NaturalLanguageToGraphBridge, ClaudeAIModel } from './nl-to-graph-bridge';

async function main() {
  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);
  
  const result = await bridge.process('Your workflow description');
  
  console.log(`✅ Created ${result.nodes.length} nodes!`);
}

main().catch(console.error);
```

## 📚 Next Steps

1. Read **README-NODEJS.md** for full documentation
2. Check **examples.ts** for comprehensive examples
3. Customize node factories for your domain
4. Create your own export formats
5. Integrate with your existing Node.js apps

**Happy Graphing with Node.js! 🚀**

---

Need help? Check:
- `README-NODEJS.md` - Full documentation
- `examples.ts` - Usage examples
- `nl-to-graph-bridge.ts` - Source code
