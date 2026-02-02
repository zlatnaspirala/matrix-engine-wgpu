/**
 * USAGE EXAMPLES - Natural Language to Graph Bridge (Node.js)
 * ============================================================
 */

import {
  NaturalLanguageToGraphBridge,
  ClaudeAIModel,
  OpenAIModel,
  StandardNodeFactory,
  FlowchartNodeFactory,
  GraphResult,
  ProcessContext,
} from './nl-to-graph-bridge';

import * as fs from 'fs';

// ============================================================================
// EXAMPLE 1: Basic Usage with Claude
// ============================================================================

async function example1_basicClaude() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 1: Basic Usage with Claude');
  console.log('='.repeat(60));

  // Initialize the bridge
  const aiModel = new ClaudeAIModel(); // API key handled automatically in claude.ai
  const bridge = new NaturalLanguageToGraphBridge(aiModel);

  // Process natural language
  const description = `
    Create a user login system with the following steps:
    1. User enters credentials
    2. System validates credentials
    3. If valid, grant access; if invalid, show error
    4. Log the login attempt
  `;

  const result = await bridge.process(description);

  console.log('\nGenerated Graph Structure:');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// ============================================================================
// EXAMPLE 2: Using Custom Node Factory
// ============================================================================

async function example2_customFactory() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 2: Custom Flowchart Factory');
  console.log('='.repeat(60));

  const aiModel = new ClaudeAIModel();
  const factory = new FlowchartNodeFactory();

  const bridge = new NaturalLanguageToGraphBridge(aiModel, factory);

  const description = 'Create a simple decision flowchart for approving a purchase request based on amount';
  const result = await bridge.process(description);

  console.log('\nFlowchart Structure:');
  console.log(JSON.stringify(result, null, 2));

  // Export to Graphviz
  const dotOutput = bridge.exportToGraphviz(result);
  console.log('\nGraphviz DOT format:');
  console.log(dotOutput);

  return result;
}

// ============================================================================
// EXAMPLE 3: Batch Processing
// ============================================================================

async function example3_batchProcessing() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 3: Batch Processing');
  console.log('='.repeat(60));

  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);

  const descriptions = [
    'Create a payment processing workflow',
    'Design an email verification flow',
    'Build a password reset process',
  ];

  const results = await bridge.processBatch(descriptions);

  results.forEach((result, i) => {
    console.log(`\n--- Result ${i + 1} ---`);
    console.log(`Nodes: ${result.nodes.length}`);
    console.log(`Edges: ${result.edges.length}`);
  });

  // Get statistics
  const stats = bridge.getStatistics();
  console.log('\nProcessing Statistics:');
  console.log(JSON.stringify(stats, null, 2));

  return results;
}

// ============================================================================
// EXAMPLE 4: Context-Aware Processing
// ============================================================================

async function example4_withContext() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 4: Context-Aware Processing');
  console.log('='.repeat(60));

  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);

  const context: ProcessContext = {
    domain: 'e-commerce',
    user_roles: ['customer', 'admin', 'vendor'],
    existing_systems: ['payment_gateway', 'inventory_db', 'user_db'],
    constraints: {
      max_response_time: '3s',
      security_level: 'high',
    },
  };

  const description = 'Create an order placement and fulfillment workflow';
  const result = await bridge.process(description, context);

  console.log('\nContext-Enriched Graph:');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// ============================================================================
// EXAMPLE 5: Custom Instructions
// ============================================================================

async function example5_customInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 5: Custom Instructions');
  console.log('='.repeat(60));

  const customInstructions = `
    - Use snake_case for all node IDs
    - Include timing estimates in node properties
    - Add error handling nodes for each major step
    - Use specific node types: api_call, validation, database_operation, notification
  `;

  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(
    aiModel,
    undefined,
    customInstructions
  );

  const description = 'Create a user registration API endpoint workflow';
  const result = await bridge.process(description);

  console.log('\nCustom-Instructed Graph:');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// ============================================================================
// EXAMPLE 6: OpenAI Integration
// ============================================================================

async function example6_openai() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 6: OpenAI Integration');
  console.log('='.repeat(60));

  // Note: Requires OpenAI API key
  const apiKey = process.env.OPENAI_API_KEY || 'your-api-key-here';
  
  try {
    const aiModel = new OpenAIModel(apiKey, 'gpt-4');
    const bridge = new NaturalLanguageToGraphBridge(aiModel);

    const description = 'Create a document approval workflow with three levels of review';
    const result = await bridge.process(description);

    console.log('\nOpenAI-Generated Graph:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.log(`Note: This requires a valid OpenAI API key. Error: ${error.message}`);
  }
}

// ============================================================================
// EXAMPLE 7: Real-World Use Case - CI/CD Pipeline
// ============================================================================

async function example7_cicdPipeline() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 7: CI/CD Pipeline Graph');
  console.log('='.repeat(60));

  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);

  const description = `
    Create a CI/CD pipeline with these stages:
    1. Developer pushes code to GitHub
    2. Trigger automated tests (unit, integration, e2e)
    3. If tests pass, build Docker image
    4. Push image to registry
    5. Deploy to staging environment
    6. Run smoke tests on staging
    7. If staging tests pass, await manual approval
    8. Deploy to production
    9. Monitor and alert if issues detected
    
    Include error handling and rollback paths.
  `;

  const result = await bridge.process(description);

  console.log(`\nGenerated ${result.nodes.length} nodes and ${result.edges.length} edges`);
  console.log('\nSample Nodes:');
  result.nodes.slice(0, 3).forEach(node => {
    console.log(`  - ${node.id}: ${node.label} (${node.type})`);
  });

  // Save to file
  fs.writeFileSync('cicd_pipeline.json', bridge.exportToJSON(result));
  console.log('\nExported to: cicd_pipeline.json');

  return result;
}

// ============================================================================
// EXAMPLE 8: Save and Load Results
// ============================================================================

async function example8_saveLoad() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 8: Save and Load Results');
  console.log('='.repeat(60));

  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);

  // Generate a graph
  const description = 'Create a shopping cart checkout flow';
  const result = await bridge.process(description);

  // Save to JSON
  const jsonOutput = bridge.exportToJSON(result);
  fs.writeFileSync('checkout_flow.json', jsonOutput);
  console.log('\nSaved to: checkout_flow.json');

  // Save to Graphviz DOT
  const dotOutput = bridge.exportToGraphviz(result);
  fs.writeFileSync('checkout_flow.dot', dotOutput);
  console.log('Saved to: checkout_flow.dot');

  // Load and verify
  const loaded = JSON.parse(fs.readFileSync('checkout_flow.json', 'utf-8'));
  console.log(`\nLoaded graph with ${loaded.nodes.length} nodes`);

  return result;
}

// ============================================================================
// EXAMPLE 9: Working with History
// ============================================================================

async function example9_history() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 9: Working with History');
  console.log('='.repeat(60));

  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);

  // Process multiple descriptions
  await bridge.process('Create a login flow');
  await bridge.process('Create a signup flow');
  await bridge.process('Create a logout flow');

  // Get history
  const history = bridge.getHistory();
  console.log(`\nProcessed ${history.length} workflows:`);
  history.forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.input.substring(0, 50)}... (${entry.output.nodes.length} nodes)`);
  });

  // Get statistics
  const stats = bridge.getStatistics();
  console.log('\nStatistics:');
  console.log(`  Total queries: ${stats.total_queries}`);
  console.log(`  Total nodes: ${stats.total_nodes_created}`);
  console.log(`  Total edges: ${stats.total_edges_created}`);
  console.log(`  Average nodes per query: ${stats.avg_nodes_per_query.toFixed(1)}`);

  // Clear history
  bridge.clearHistory();
  console.log('\nHistory cleared!');
}

// ============================================================================
// EXAMPLE 10: Error Handling
// ============================================================================

async function example10_errorHandling() {
  console.log('\n' + '='.repeat(60));
  console.log('EXAMPLE 10: Error Handling');
  console.log('='.repeat(60));

  const aiModel = new ClaudeAIModel();
  const bridge = new NaturalLanguageToGraphBridge(aiModel);

  try {
    const result = await bridge.process('Create a complex workflow');
    console.log('✅ Success!');
    console.log(`Generated ${result.nodes.length} nodes`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('This is how you handle errors gracefully');
  }
}

// ============================================================================
// EXAMPLE OUTPUT STRUCTURE
// ============================================================================

const EXAMPLE_OUTPUT = {
  nodes: [
    {
      id: 'start_login',
      type: 'start',
      label: 'Login Start',
      properties: {},
      metadata: { entry_point: true },
    },
    {
      id: 'input_credentials',
      type: 'data',
      label: 'Enter Username & Password',
      properties: {
        fields: ['username', 'password'],
        validation: 'required',
      },
      metadata: {},
    },
    {
      id: 'validate_credentials',
      type: 'process',
      label: 'Validate Credentials',
      properties: {
        method: 'check_database',
        timeout: '5s',
      },
      metadata: {},
    },
    {
      id: 'check_valid',
      type: 'decision',
      label: 'Are Credentials Valid?',
      properties: {
        condition: 'credentials_match',
      },
      metadata: {},
    },
  ],
  edges: [
    {
      source: 'start_login',
      target: 'input_credentials',
      properties: {},
    },
    {
      source: 'input_credentials',
      target: 'validate_credentials',
      label: 'submit',
      properties: {},
    },
    {
      source: 'validate_credentials',
      target: 'check_valid',
      properties: {},
    },
  ],
  metadata: {
    description: 'User authentication login flow',
    intent: 'Create secure login process with validation and logging',
  },
};

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

async function runAllExamples() {
  console.log('Natural Language to Graph Bridge - Node.js Examples');
  console.log('='.repeat(60));

  const examples = [
    { name: 'Basic Claude Usage', fn: example1_basicClaude },
    { name: 'Custom Factory', fn: example2_customFactory },
    { name: 'Batch Processing', fn: example3_batchProcessing },
    { name: 'Context-Aware', fn: example4_withContext },
    { name: 'Custom Instructions', fn: example5_customInstructions },
    { name: 'OpenAI Integration', fn: example6_openai },
    { name: 'CI/CD Pipeline', fn: example7_cicdPipeline },
    { name: 'Save and Load', fn: example8_saveLoad },
    { name: 'Working with History', fn: example9_history },
    { name: 'Error Handling', fn: example10_errorHandling },
  ];

  for (const example of examples) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Running: ${example.name}`);
      console.log('='.repeat(60));
      await example.fn();
    } catch (error: any) {
      console.error(`Error in ${example.name}:`, error.message);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

if (require.main === module) {
  console.log('Natural Language to Graph Bridge - Examples');
  console.log('='.repeat(60));
  console.log('\nThese examples show different ways to use the bridge:');
  console.log('1. Basic usage');
  console.log('2. Custom node factories');
  console.log('3. Batch processing');
  console.log('4. Context-aware generation');
  console.log('5. Custom AI instructions');
  console.log('6. OpenAI integration');
  console.log('7. Real-world CI/CD pipeline');
  console.log('8. Save and load results');
  console.log('9. Working with history');
  console.log('10. Error handling');
  console.log('\n' + '='.repeat(60));

  // Print example output
  console.log('\nEXAMPLE OUTPUT STRUCTURE:');
  console.log(JSON.stringify(EXAMPLE_OUTPUT, null, 2));

  // Uncomment to run all examples
  // runAllExamples().catch(console.error);
}

// Export for use in other files
export {
  example1_basicClaude,
  example2_customFactory,
  example3_batchProcessing,
  example4_withContext,
  example5_customInstructions,
  example6_openai,
  example7_cicdPipeline,
  example8_saveLoad,
  example9_history,
  example10_errorHandling,
  runAllExamples,
};
