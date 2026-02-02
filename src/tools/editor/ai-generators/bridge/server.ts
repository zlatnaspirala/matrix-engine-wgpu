/**
 * Express.js Server Example
 * RESTful API for Natural Language to Graph Bridge
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  NaturalLanguageToGraphBridge,
  ClaudeAIModel,
  OpenAIModel,
  StandardNodeFactory,
  FlowchartNodeFactory,
  GraphResult,
  ProcessContext,
} from './nl-to-graph-bridge';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI models
const claudeModel = new ClaudeAIModel(process.env.ANTHROPIC_API_KEY);
const openaiModel = process.env.OPENAI_API_KEY 
  ? new OpenAIModel(process.env.OPENAI_API_KEY)
  : null;

// Initialize bridges
const standardBridge = new NaturalLanguageToGraphBridge(claudeModel);
const flowchartBridge = new NaturalLanguageToGraphBridge(
  claudeModel,
  new FlowchartNodeFactory()
);

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * POST /api/generate
 * Generate graph from natural language
 * 
 * Body:
 * {
 *   "description": "Create a login flow",
 *   "context": { "domain": "auth" },
 *   "factory": "standard" | "flowchart",
 *   "ai_model": "claude" | "openai"
 * }
 */
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { description, context, factory = 'standard', ai_model = 'claude' } = req.body;

    if (!description) {
      return res.status(400).json({ 
        error: 'Description is required' 
      });
    }

    // Select bridge based on factory type
    const bridge = factory === 'flowchart' ? flowchartBridge : standardBridge;

    // Process the description
    const result = await bridge.process(description, context);

    res.json({
      success: true,
      result,
      statistics: {
        nodes: result.nodes.length,
        edges: result.edges.length,
        complexity: Math.round((result.nodes.length + result.edges.length) / 2)
      }
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate graph',
      message: error.message 
    });
  }
});

/**
 * POST /api/batch
 * Process multiple descriptions in batch
 * 
 * Body:
 * {
 *   "descriptions": ["Flow 1", "Flow 2"],
 *   "context": { "domain": "ecommerce" }
 * }
 */
app.post('/api/batch', async (req: Request, res: Response) => {
  try {
    const { descriptions, context } = req.body;

    if (!descriptions || !Array.isArray(descriptions)) {
      return res.status(400).json({ 
        error: 'Descriptions array is required' 
      });
    }

    const results = await standardBridge.processBatch(descriptions, context);

    res.json({
      success: true,
      results,
      summary: {
        total: results.length,
        total_nodes: results.reduce((sum, r) => sum + r.nodes.length, 0),
        total_edges: results.reduce((sum, r) => sum + r.edges.length, 0)
      }
    });

  } catch (error: any) {
    console.error('Batch processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process batch',
      message: error.message 
    });
  }
});

/**
 * POST /api/export
 * Export graph result to different formats
 * 
 * Body:
 * {
 *   "result": { nodes: [...], edges: [...] },
 *   "format": "json" | "graphviz"
 * }
 */
app.post('/api/export', (req: Request, res: Response) => {
  try {
    const { result, format = 'json' } = req.body;

    if (!result) {
      return res.status(400).json({ 
        error: 'Result is required' 
      });
    }

    let output: string;
    let contentType: string;
    let filename: string;

    if (format === 'graphviz' || format === 'dot') {
      output = standardBridge.exportToGraphviz(result);
      contentType = 'text/plain';
      filename = 'graph.dot';
    } else {
      output = standardBridge.exportToJSON(result);
      contentType = 'application/json';
      filename = 'graph.json';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(output);

  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Failed to export',
      message: error.message 
    });
  }
});

/**
 * GET /api/statistics
 * Get processing statistics
 */
app.get('/api/statistics', (req: Request, res: Response) => {
  try {
    const stats = standardBridge.getStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to get statistics',
      message: error.message 
    });
  }
});

/**
 * GET /api/history
 * Get conversation history
 */
app.get('/api/history', (req: Request, res: Response) => {
  try {
    const history = standardBridge.getHistory();
    res.json({ 
      success: true, 
      history: history.map(entry => ({
        input: entry.input,
        nodes_count: entry.output.nodes.length,
        edges_count: entry.output.edges.length,
        timestamp: entry.timestamp
      }))
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to get history',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/history
 * Clear conversation history
 */
app.delete('/api/history', (req: Request, res: Response) => {
  try {
    standardBridge.clearHistory();
    flowchartBridge.clearHistory();
    res.json({ success: true, message: 'History cleared' });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Failed to clear history',
      message: error.message 
    });
  }
});

/**
 * GET /api/node-types
 * Get available node types
 */
app.get('/api/node-types', (req: Request, res: Response) => {
  const nodeTypes = [
    { value: 'process', label: 'Process', description: 'Processing step' },
    { value: 'decision', label: 'Decision', description: 'Conditional branch' },
    { value: 'data', label: 'Data', description: 'Data input/output' },
    { value: 'start', label: 'Start', description: 'Entry point' },
    { value: 'end', label: 'End', description: 'Exit point' },
    { value: 'subprocess', label: 'Subprocess', description: 'Sub-workflow' },
    { value: 'database', label: 'Database', description: 'Database operation' },
    { value: 'external_entity', label: 'External Entity', description: 'External system' },
    { value: 'condition', label: 'Condition', description: 'State condition' },
    { value: 'action', label: 'Action', description: 'Action/command' },
    { value: 'state', label: 'State', description: 'State in FSM' },
    { value: 'event', label: 'Event', description: 'Event trigger' },
  ];

  res.json({ success: true, node_types: nodeTypes });
});

/**
 * POST /api/validate
 * Validate graph structure
 */
app.post('/api/validate', (req: Request, res: Response) => {
  try {
    const { nodes, edges } = req.body;

    if (!nodes || !Array.isArray(nodes)) {
      return res.status(400).json({ 
        valid: false,
        error: 'Nodes array is required' 
      });
    }

    if (!edges || !Array.isArray(edges)) {
      return res.status(400).json({ 
        valid: false,
        error: 'Edges array is required' 
      });
    }

    // Validate that all edges reference valid nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const invalidEdges = edges.filter(
      e => !nodeIds.has(e.source) || !nodeIds.has(e.target)
    );

    if (invalidEdges.length > 0) {
      return res.json({
        valid: false,
        error: 'Some edges reference non-existent nodes',
        invalid_edges: invalidEdges
      });
    }

    res.json({ 
      valid: true,
      statistics: {
        nodes: nodes.length,
        edges: edges.length,
        complexity: Math.round((nodes.length + edges.length) / 2)
      }
    });

  } catch (error: any) {
    res.status(500).json({ 
      valid: false,
      error: 'Validation failed',
      message: error.message 
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API Endpoints:`);
  console.log(`   POST /api/generate - Generate graph from description`);
  console.log(`   POST /api/batch - Batch process multiple descriptions`);
  console.log(`   POST /api/export - Export graph to different formats`);
  console.log(`   GET  /api/statistics - Get processing statistics`);
  console.log(`   GET  /api/history - Get conversation history`);
  console.log(`   DELETE /api/history - Clear history`);
  console.log(`   GET  /api/node-types - Get available node types`);
  console.log(`   POST /api/validate - Validate graph structure`);
});

export default app;
