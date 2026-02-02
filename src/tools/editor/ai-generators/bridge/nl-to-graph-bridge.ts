/**
 * Natural Language to Graph Bridge - Node.js/TypeScript
 * Converts natural language descriptions into structured graph nodes using AI
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export enum NodeType {
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

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  properties: Record<string, any>;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: Record<string, any>;
  raw_response?: string;
}

export interface ProcessContext {
  domain?: string;
  user_roles?: string[];
  existing_systems?: string[];
  constraints?: Record<string, any>;
  [key: string]: any;
}

export interface NodeSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

export interface ConversationEntry {
  input: string;
  output: GraphResult;
  context?: ProcessContext;
  timestamp: Date;
}

export interface BridgeStatistics {
  total_queries: number;
  total_nodes_created: number;
  total_edges_created: number;
  avg_nodes_per_query: number;
}

// ============================================================================
// AI MODEL INTERFACE
// ============================================================================

export abstract class AIModelInterface {
  abstract generate(prompt: string, systemPrompt?: string): Promise<string>;
  abstract parseResponse(response: string): GraphResult;
}

// ============================================================================
// CLAUDE AI MODEL
// ============================================================================

export class ClaudeAIModel extends AIModelInterface {
  private apiKey?: string;
  private model: string;
  private client: AxiosInstance;

  constructor(apiKey?: string, model: string = 'claude-sonnet-4-20250514') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    
    this.client = axios.create({
      baseURL: 'https://api.anthropic.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        ...(apiKey && { 'x-api-key': apiKey }),
      },
    });
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const payload: any = {
        model: this.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      };

      if (systemPrompt) {
        payload.system = systemPrompt;
      }

      const response = await this.client.post('/messages', payload);
      return response.data.content[0].text;
    } catch (error: any) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  parseResponse(response: string): GraphResult {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Continue to try parsing the whole response
      }
    }

    // Try to parse the whole response
    try {
      return JSON.parse(response);
    } catch (e) {
      throw new Error('Could not parse JSON from AI response');
    }
  }
}

// ============================================================================
// OPENAI MODEL
// ============================================================================

export class OpenAIModel extends AIModelInterface {
  private apiKey: string;
  private model: string;
  private client: AxiosInstance;

  constructor(apiKey: string, model: string = 'gpt-4') {
    super();
    this.apiKey = apiKey;
    this.model = model;
    
    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: any[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages,
        temperature: 0.7,
      });

      return response.data.choices[0].message.content;
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  parseResponse(response: string): GraphResult {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Continue to full parse
      }
    }

    try {
      return JSON.parse(response);
    } catch (e) {
      throw new Error('Could not parse JSON from AI response');
    }
  }
}

// ============================================================================
// NODE FACTORY
// ============================================================================

export abstract class NodeFactory {
  abstract createNode(nodeData: Partial<GraphNode>): GraphNode;
  abstract getSchema(): NodeSchema;
  
  protected generateId(): string {
    return `node_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class StandardNodeFactory extends NodeFactory {
  createNode(nodeData: Partial<GraphNode>): GraphNode {
    return {
      id: nodeData.id || this.generateId(),
      type: nodeData.type || 'process',
      label: nodeData.label || 'Unnamed',
      properties: nodeData.properties || {},
      metadata: nodeData.metadata || {},
    };
  }

  getSchema(): NodeSchema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { 
          type: 'string', 
          enum: Object.values(NodeType) 
        },
        label: { type: 'string' },
        properties: { type: 'object' },
        metadata: { type: 'object' },
      },
      required: ['label', 'type'],
    };
  }
}

export class FlowchartNodeFactory extends NodeFactory {
  createNode(nodeData: Partial<GraphNode>): GraphNode {
    const nodeType = nodeData.type || 'process';
    
    const properties = {
      ...(nodeData.properties || {}),
      shape: this.getShapeForType(nodeType),
      color: this.getColorForType(nodeType),
    };

    return {
      id: nodeData.id || this.generateId(),
      type: nodeType,
      label: nodeData.label || 'Unnamed',
      properties,
      metadata: nodeData.metadata || {},
    };
  }

  getSchema(): NodeSchema {
    return {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: {
          type: 'string',
          enum: ['start', 'end', 'process', 'decision', 'input_output', 'subprocess'],
        },
        label: { type: 'string' },
        properties: { type: 'object' },
        metadata: { type: 'object' },
      },
      required: ['label', 'type'],
    };
  }

  private getShapeForType(nodeType: string): string {
    const shapes: Record<string, string> = {
      start: 'ellipse',
      end: 'ellipse',
      process: 'rectangle',
      decision: 'diamond',
      input_output: 'parallelogram',
      subprocess: 'rectangle_double',
    };
    return shapes[nodeType] || 'rectangle';
  }

  private getColorForType(nodeType: string): string {
    const colors: Record<string, string> = {
      start: '#90EE90',
      end: '#FFB6C6',
      process: '#87CEEB',
      decision: '#FFD700',
      input_output: '#DDA0DD',
      subprocess: '#F0E68C',
    };
    return colors[nodeType] || '#FFFFFF';
  }
}

// ============================================================================
// MAIN BRIDGE CLASS
// ============================================================================

export class NaturalLanguageToGraphBridge {
  private aiModel: AIModelInterface;
  private nodeFactory: NodeFactory;
  private customInstructions?: string;
  private conversationHistory: ConversationEntry[] = [];

  constructor(
    aiModel: AIModelInterface,
    nodeFactory?: NodeFactory,
    customInstructions?: string
  ) {
    this.aiModel = aiModel;
    this.nodeFactory = nodeFactory || new StandardNodeFactory();
    this.customInstructions = customInstructions;
  }

  /**
   * Process natural language input and generate graph structure
   */
  async process(
    naturalLanguage: string,
    context?: ProcessContext
  ): Promise<GraphResult> {
    // Build prompts
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(naturalLanguage, context);

    // Get AI response
    const response = await this.aiModel.generate(userPrompt, systemPrompt);

    // Parse response
    const parsed = this.aiModel.parseResponse(response);

    // Create node objects
    const nodes = parsed.nodes.map(nodeData =>
      this.nodeFactory.createNode(nodeData)
    );

    // Create edge objects
    const edges: GraphEdge[] = parsed.edges.map(edgeData => ({
      source: edgeData.source,
      target: edgeData.target,
      label: edgeData.label,
      properties: edgeData.properties || {},
    }));

    // Store in history
    const result: GraphResult = {
      nodes,
      edges,
      metadata: parsed.metadata || {},
      raw_response: response,
    };

    this.conversationHistory.push({
      input: naturalLanguage,
      output: result,
      context,
      timestamp: new Date(),
    });

    return result;
  }

  /**
   * Process multiple descriptions in batch
   */
  async processBatch(
    descriptions: string[],
    sharedContext?: ProcessContext
  ): Promise<GraphResult[]> {
    const results: GraphResult[] = [];

    for (const desc of descriptions) {
      const result = await this.process(desc, sharedContext);
      results.push(result);
    }

    return results;
  }

  /**
   * Export result to JSON file
   */
  exportToJSON(result: GraphResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Export to Graphviz DOT format
   */
  exportToGraphviz(result: GraphResult): string {
    const lines = ['digraph G {'];
    lines.push('  rankdir=LR;');
    lines.push('  node [shape=box, style=rounded];');
    lines.push('');

    // Add nodes
    result.nodes.forEach(node => {
      const label = node.label.replace(/"/g, '\\"');
      lines.push(`  "${node.id}" [label="${label}"];`);
    });

    lines.push('');

    // Add edges
    result.edges.forEach(edge => {
      const label = edge.label ? ` [label="${edge.label}"]` : '';
      lines.push(`  "${edge.source}" -> "${edge.target}"${label};`);
    });

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Get processing statistics
   */
  getStatistics(): BridgeStatistics {
    const totalNodes = this.conversationHistory.reduce(
      (sum, entry) => sum + entry.output.nodes.length,
      0
    );

    const totalEdges = this.conversationHistory.reduce(
      (sum, entry) => sum + entry.output.edges.length,
      0
    );

    return {
      total_queries: this.conversationHistory.length,
      total_nodes_created: totalNodes,
      total_edges_created: totalEdges,
      avg_nodes_per_query:
        this.conversationHistory.length > 0
          ? totalNodes / this.conversationHistory.length
          : 0,
    };
  }

  /**
   * Get conversation history
   */
  getHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private buildSystemPrompt(): string {
    const schema = this.nodeFactory.getSchema();

    let prompt = `You are a graph structure expert that converts natural language descriptions into structured graph nodes.

Your task is to analyze the input and generate a JSON structure representing graph nodes and their connections.

NODE SCHEMA:
${JSON.stringify(schema, null, 2)}

RESPONSE FORMAT:
You must respond with a valid JSON object with this structure:
{
  "nodes": [
    {
      "id": "unique_id",
      "type": "node_type",
      "label": "Node Label",
      "properties": {},
      "metadata": {}
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "connection_label",
      "properties": {}
    }
  ],
  "metadata": {
    "description": "Overall graph description",
    "intent": "Detected user intent"
  }
}

RULES:
1. Generate meaningful IDs (e.g., "auth_check", "process_payment")
2. Choose appropriate node types
3. Create logical connections between nodes
4. Include relevant properties and metadata
5. Respond ONLY with valid JSON, no additional text
`;

    if (this.customInstructions) {
      prompt += `\n\nADDITIONAL INSTRUCTIONS:\n${this.customInstructions}`;
    }

    return prompt;
  }

  private buildUserPrompt(
    naturalLanguage: string,
    context?: ProcessContext
  ): string {
    let prompt = `Convert this description into a graph structure:\n\n${naturalLanguage}`;

    if (context) {
      prompt += `\n\nContext:\n${JSON.stringify(context, null, 2)}`;
    }

    if (this.conversationHistory.length > 0) {
      prompt += '\n\nPrevious interactions:\n';
      const recent = this.conversationHistory.slice(-3);
      recent.forEach((entry, i) => {
        const preview = entry.input.substring(0, 100);
        prompt += `\n${i + 1}. Input: ${preview}${entry.input.length > 100 ? '...' : ''}`;
      });
    }

    return prompt;
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default NaturalLanguageToGraphBridge;
