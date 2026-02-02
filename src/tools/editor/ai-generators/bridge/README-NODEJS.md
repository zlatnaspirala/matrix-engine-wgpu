# Natural Language to Graph Bridge - Node.js/TypeScript 🌉🤖

A powerful TypeScript library that converts natural language descriptions into structured graph nodes using AI models (Claude, OpenAI, etc.).

## 🚀 Features

- **Multiple AI Model Support**: Claude, OpenAI GPT, extensible to any AI API
- **TypeScript First**: Full type safety and IntelliSense support
- **Flexible Node Factories**: Create custom node types for your specific use case
- **Context-Aware Generation**: Provide domain context for better results
- **Batch Processing**: Process multiple descriptions efficiently
- **Export Options**: JSON, Graphviz DOT format
- **Conversation History**: Track and learn from previous interactions
- **Custom Instructions**: Fine-tune AI behavior for your domain

## 📦 Installation

```bash
npm install nl-to-graph-bridge
# or
yarn add nl-to-graph-bridge
```

For development:
```bash
npm install axios
npm install --save-dev typescript @types/node ts-node
```

## 🎯 Quick Start

### Basic Usage

```typescript
import { NaturalLanguageToGraphBridge, ClaudeAIModel } from 'nl-to-graph-bridge';

async function main() {
  // Initialize
  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);
  
  // Convert natural language to graph
  const description = 'Create a user login system with validation and error handling';
  const result = await bridge.process(description);
  
  console.log(`Generated ${result.nodes.length} nodes`);
  console.log(`Generated ${result.edges.length} edges`);
  
  // Export to JSON
  const json = bridge.exportToJSON(result);
  console.log(json);
}

main().catch(console.error);
```

### JavaScript Usage (without TypeScript)

```javascript
const { NaturalLanguageToGraphBridge, ClaudeAIModel } = require('nl-to-graph-bridge');

async function main() {
  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);
  
  const result = await bridge.process('Create a payment processing workflow');
  console.log(`Nodes: ${result.nodes.length}`);
}

main();
```

## 🏗️ Architecture

```typescript
// Core Types
interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  metadata: Record<string, any>;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  properties: Record<string, any>;
}

interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: Record<string, any>;
}
```

## 💡 Usage Examples

### Example 1: Basic Login Flow

```typescript
import { NaturalLanguageToGraphBridge, ClaudeAIModel } from './nl-to-graph-bridge';

const aiModel = new ClaudeAIModel();
const bridge = new NaturalLanguageToGraphBridge(aiModel);

const description = `
  Create a user login system:
  1. User enters username and password
  2. System validates credentials
  3. If valid, grant access to dashboard
  4. If invalid, show error message
`;

const result = await bridge.process(description);
console.log(`Created ${result.nodes.length} nodes!`);
```

### Example 2: Custom Node Factory

```typescript
import { NodeFactory, GraphNode, FlowchartNodeFactory } from './nl-to-graph-bridge';

// Use built-in flowchart factory
const factory = new FlowchartNodeFactory();
const bridge = new NaturalLanguageToGraphBridge(aiModel, factory);

// Or create custom factory
class MyCustomFactory extends NodeFactory {
  createNode(nodeData: Partial<GraphNode>): GraphNode {
    return {
      id: nodeData.id || this.generateId(),
      type: nodeData.type || 'process',
      label: nodeData.label || 'Unnamed',
      properties: {
        ...nodeData.properties,
        timestamp: new Date().toISOString(),
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

const customFactory = new MyCustomFactory();
const bridge2 = new NaturalLanguageToGraphBridge(aiModel, customFactory);
```

### Example 3: Context-Aware Generation

```typescript
const context = {
  domain: 'e-commerce',
  user_roles: ['customer', 'admin', 'vendor'],
  existing_systems: ['payment_gateway', 'inventory_db'],
  constraints: {
    max_response_time: '3s',
    security_level: 'high'
  }
};

const result = await bridge.process(
  'Create an order placement workflow',
  context
);
```

### Example 4: Batch Processing

```typescript
const descriptions = [
  'Create a payment processing workflow',
  'Design an email verification flow',
  'Build a password reset process'
];

const results = await bridge.processBatch(descriptions);

results.forEach((result, i) => {
  console.log(`Flow ${i + 1}: ${result.nodes.length} nodes`);
});

// Get statistics
const stats = bridge.getStatistics();
console.log(`Total queries: ${stats.total_queries}`);
console.log(`Total nodes: ${stats.total_nodes_created}`);
```

### Example 5: Custom Instructions

```typescript
const customInstructions = `
  - Use snake_case for all IDs
  - Include timing estimates in node properties
  - Add error handling nodes for each major step
  - Use specific types: api_call, validation, database_operation
`;

const bridge = new NaturalLanguageToGraphBridge(
  aiModel,
  undefined,
  customInstructions
);

const result = await bridge.process('Create a user registration API');
```

### Example 6: Export Formats

```typescript
import * as fs from 'fs';

const result = await bridge.process('Create a checkout flow');

// Export to JSON
const jsonOutput = bridge.exportToJSON(result);
fs.writeFileSync('checkout_flow.json', jsonOutput);

// Export to Graphviz DOT
const dotOutput = bridge.exportToGraphviz(result);
fs.writeFileSync('checkout_flow.dot', dotOutput);

// Convert to PNG (requires Graphviz installed)
// dot -Tpng checkout_flow.dot -o checkout_flow.png
```

### Example 7: OpenAI Integration

```typescript
import { OpenAIModel } from './nl-to-graph-bridge';

const apiKey = process.env.OPENAI_API_KEY!;
const aiModel = new OpenAIModel(apiKey, 'gpt-4');
const bridge = new NaturalLanguageToGraphBridge(aiModel);

const result = await bridge.process('Create a document approval workflow');
```

### Example 8: Working with History

```typescript
// Process multiple workflows
await bridge.process('Create a login flow');
await bridge.process('Create a signup flow');
await bridge.process('Create a logout flow');

// Get history
const history = bridge.getHistory();
console.log(`Processed ${history.length} workflows`);

history.forEach((entry, i) => {
  console.log(`${i + 1}. ${entry.input} (${entry.output.nodes.length} nodes)`);
});

// Clear history
bridge.clearHistory();
```

## 🎨 Node Types

Built-in node types (fully extensible):

```typescript
enum NodeType {
  PROCESS = 'process',
  DECISION = 'decision',
  DATA = 'data',
  START = 'start',
  END = 'end',
  SUBPROCESS = 'subprocess',
  DATABASE = 'database',
  EXTERNAL_ENTITY = 'external_entity',
  CONDITION = 'condition',
  ACTION = 'action',
  STATE = 'state',
  EVENT = 'event',
}
```

## 📤 Export Formats

### JSON Export

```typescript
const json = bridge.exportToJSON(result);
fs.writeFileSync('output.json', json);
```

Output:
```json
{
  "nodes": [
    {
      "id": "input_credentials",
      "type": "data",
      "label": "Enter Username & Password",
      "properties": { "fields": ["username", "password"] },
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

### Graphviz DOT Export

```typescript
const dot = bridge.exportToGraphviz(result);
fs.writeFileSync('graph.dot', dot);
```

Output:
```dot
digraph G {
  rankdir=LR;
  node [shape=box, style=rounded];
  
  "input_credentials" [label="Enter Username & Password"];
  "validate_credentials" [label="Validate Credentials"];
  
  "input_credentials" -> "validate_credentials" [label="submit"];
}
```

## 🧪 Testing

```typescript
import { NaturalLanguageToGraphBridge, ClaudeAIModel } from './nl-to-graph-bridge';

describe('NaturalLanguageToGraphBridge', () => {
  let bridge: NaturalLanguageToGraphBridge;
  
  beforeEach(() => {
    const aiModel = new ClaudeAIModel();
    bridge = new NaturalLanguageToGraphBridge(aiModel);
  });
  
  test('should process simple description', async () => {
    const result = await bridge.process('Create a simple login flow');
    
    expect(result.nodes).toBeDefined();
    expect(result.edges).toBeDefined();
    expect(result.nodes.length).toBeGreaterThan(0);
  });
  
  test('should handle batch processing', async () => {
    const descriptions = ['Flow 1', 'Flow 2', 'Flow 3'];
    const results = await bridge.processBatch(descriptions);
    
    expect(results).toHaveLength(3);
  });
});
```

## 🔌 Extending the Bridge

### Custom AI Model

```typescript
import { AIModelInterface, GraphResult } from './nl-to-graph-bridge';

class MyAIModel extends AIModelInterface {
  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    // Your AI API call here
    const response = await myAIAPI.complete(prompt);
    return response;
  }
  
  parseResponse(response: string): GraphResult {
    // Parse your AI's response format
    return JSON.parse(response);
  }
}

// Use it
const aiModel = new MyAIModel();
const bridge = new NaturalLanguageToGraphBridge(aiModel);
```

### Custom Export Format

```typescript
function exportToMermaid(result: GraphResult): string {
  const lines = ['graph TD'];
  
  result.nodes.forEach(node => {
    lines.push(`    ${node.id}[${node.label}]`);
  });
  
  result.edges.forEach(edge => {
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`    ${edge.source} -->${label} ${edge.target}`);
  });
  
  return lines.join('\n');
}

// Use it
const mermaid = exportToMermaid(result);
fs.writeFileSync('diagram.mmd', mermaid);
```

## 🎯 Use Cases

1. **Workflow Automation**: Convert process descriptions to executable workflows
2. **Documentation**: Generate visual process documentation from text
3. **System Design**: Create system architecture diagrams from requirements
4. **Business Process Modeling**: Convert business rules to BPMN-like graphs
5. **State Machines**: Design FSMs from behavior descriptions
6. **API Design**: Generate API flow diagrams
7. **CI/CD Pipelines**: Visualize deployment workflows
8. **Data Pipelines**: Map ETL processes

## 📊 Example Output

Input:
```
"Create a payment processing system"
```

Output:
```json
{
  "nodes": [
    {"id": "collect_payment", "type": "data", "label": "Collect Payment Info"},
    {"id": "validate_card", "type": "process", "label": "Validate Card"},
    {"id": "check_fraud", "type": "decision", "label": "Fraud Check"},
    {"id": "process_payment", "type": "subprocess", "label": "Process Payment"},
    {"id": "update_order", "type": "database", "label": "Update Order Status"},
    {"id": "send_receipt", "type": "external_entity", "label": "Send Receipt"}
  ],
  "edges": [
    {"source": "collect_payment", "target": "validate_card"},
    {"source": "validate_card", "target": "check_fraud"},
    {"source": "check_fraud", "target": "process_payment", "label": "pass"},
    {"source": "process_payment", "target": "update_order"},
    {"source": "update_order", "target": "send_receipt"}
  ]
}
```

## ⚙️ Configuration

### Environment Variables

```bash
# .env file
ANTHROPIC_API_KEY=your-claude-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Usage with dotenv

```typescript
import * as dotenv from 'dotenv';
dotenv.config();

const aiModel = new ClaudeAIModel(process.env.ANTHROPIC_API_KEY);
```

## 📈 Performance

- **Average processing time**: 2-5 seconds per request
- **Batch processing**: ~10 requests per minute
- **Memory usage**: Minimal (< 100MB for typical use)
- **Concurrency**: Async design supports high concurrency

## 🔒 Security

- Store API keys in environment variables
- Never commit API keys to version control
- Validate all user input before processing
- Implement rate limiting for production use

## 🛠️ Development

```bash
# Clone repository
git clone <repository-url>
cd nl-to-graph-bridge

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run examples
npm run example

# Run tests
npm test

# Watch mode
npm run build:watch
```

## 📝 Scripts

```json
{
  "build": "tsc",
  "test": "jest",
  "example": "ts-node examples.ts",
  "lint": "eslint src/**/*.ts",
  "format": "prettier --write \"src/**/*.ts\""
}
```

## 📚 API Reference

### NaturalLanguageToGraphBridge

```typescript
class NaturalLanguageToGraphBridge {
  constructor(
    aiModel: AIModelInterface,
    nodeFactory?: NodeFactory,
    customInstructions?: string
  );
  
  process(naturalLanguage: string, context?: ProcessContext): Promise<GraphResult>;
  processBatch(descriptions: string[], sharedContext?: ProcessContext): Promise<GraphResult[]>;
  exportToJSON(result: GraphResult): string;
  exportToGraphviz(result: GraphResult): string;
  getStatistics(): BridgeStatistics;
  getHistory(): ConversationEntry[];
  clearHistory(): void;
}
```

## 🤝 Contributing

Contributions welcome! Please see CONTRIBUTING.md for guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Anthropic for Claude API
- OpenAI for GPT models
- The TypeScript community

---

**Built with ❤️ for developers who want to visualize complex processes**

**Happy Coding! 🚀**
