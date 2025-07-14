const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/timfee/scheduler/blob/main/docs/adr-006-file-organization-patterns.md#${name}`
);

module.exports = createRule({
  name: 'file-organization',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce file organization patterns as defined in ADR-006',
      recommended: 'error',
    },
    messages: {
      serverImportClient: 'Server code cannot import from client components directory. Server code at "{{serverPath}}" is importing from "{{clientPath}}". Move shared logic to /lib/ or create server-only utilities.',
      serverImportHooks: 'Server code cannot import from hooks directory. Server code at "{{serverPath}}" is importing from "{{hooksPath}}". Move shared logic to /lib/ or create server-only utilities.',
      invalidServerActionExport: 'Server action "{{actionName}}" should use named export, not default export.',
      invalidServerActionNaming: 'Server action "{{actionName}}" should follow naming pattern: [verb][Feature]Action (e.g., createConnectionAction).',
      invalidComponentExport: 'Main component "{{componentName}}" should use default export.',
      invalidHookExport: 'Hook "{{hookName}}" should use named export, not default export.',
      invalidHookNaming: 'Hook "{{hookName}}" should follow naming pattern: use[FeatureName] (e.g., useConnectionForm).',
      crossFeatureImport: 'Feature "{{currentFeature}}" cannot import from feature "{{targetFeature}}". Use shared utilities in /lib/ or props/URL state for cross-feature communication.',
      invalidFileInComponentsDir: 'Only "ui" and "layout" directories are allowed under components/. File "{{filePath}}" should be moved to root components/ directory or feature-specific components.',
      useServerMissingInActions: 'Server action files should start with "use server" directive.',
      useClientMissingInComponents: 'Client component files should start with "use client" directive when using React hooks.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of feature directory names',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      features: ['booking', 'connections', 'admin', 'appointments'],
    },
  ],
  create(context, [options]) {
    const filename = context.getFilename();
    const features = options.features || [];
    
    // Helper functions
    function isServerFile(path) {
      return path.includes('/server/') || path.includes('\\server\\');
    }
    
    function isClientFile(path) {
      return path.includes('/components/') || path.includes('\\components\\') ||
             path.includes('/hooks/') || path.includes('\\hooks\\');
    }
    
    function isServerActionFile(path) {
      return isServerFile(path) && (path.endsWith('/actions.ts') || path.endsWith('\\actions.ts'));
    }
    
    function isHookFile(path) {
      return path.includes('/hooks/') || path.includes('\\hooks\\');
    }
    
    function getFeatureFromPath(path) {
      const match = path.match(/app[/\\]([^/\\]+)[/\\]/);
      return match ? match[1].replace(/[()]/g, '') : null;
    }
    
    function isActionFunction(node) {
      return node.type === 'FunctionDeclaration' && 
             node.id && 
             node.id.name.endsWith('Action');
    }
    
    function isHookFunction(node) {
      return node.type === 'FunctionDeclaration' && 
             node.id && 
             node.id.name.startsWith('use');
    }

    return {
      // Check imports for architectural violations
      ImportDeclaration(node) {
        const importPath = node.source.value;
        const currentFeature = getFeatureFromPath(filename);
        
        if (isServerFile(filename)) {
          // Server files cannot import from client components
          if (importPath.includes('/components/') && !importPath.includes('/ui/')) {
            context.report({
              node,
              messageId: 'serverImportClient',
              data: {
                serverPath: filename,
                clientPath: importPath,
              },
            });
          }
          
          // Server files cannot import from hooks
          if (importPath.includes('/hooks/')) {
            context.report({
              node,
              messageId: 'serverImportHooks',
              data: {
                serverPath: filename,
                hooksPath: importPath,
              },
            });
          }
        }
        
        // Check for cross-feature imports
        if (currentFeature && importPath.startsWith('@/app/')) {
          const targetFeature = getFeatureFromPath(importPath);
          if (targetFeature && targetFeature !== currentFeature && features.includes(targetFeature)) {
            context.report({
              node,
              messageId: 'crossFeatureImport',
              data: {
                currentFeature,
                targetFeature,
              },
            });
          }
        }
      },

      // Check server action exports and naming
      ExportNamedDeclaration(node) {
        if (isServerActionFile(filename) && node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            const functionName = node.declaration.id?.name;
            if (functionName && isActionFunction(node.declaration)) {
              // Check naming pattern
              if (!/^[a-z]+[A-Z][a-zA-Z]*Action$/.test(functionName)) {
                context.report({
                  node,
                  messageId: 'invalidServerActionNaming',
                  data: { actionName: functionName },
                });
              }
            }
          }
        }
        
        // Check hook exports
        if (isHookFile(filename) && node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            const functionName = node.declaration.id?.name;
            if (functionName && isHookFunction(node.declaration)) {
              // Check naming pattern
              if (!/^use[A-Z][a-zA-Z]*$/.test(functionName)) {
                context.report({
                  node,
                  messageId: 'invalidHookNaming',
                  data: { hookName: functionName },
                });
              }
            }
          }
        }
      },

      // Check for default exports in server actions
      ExportDefaultDeclaration(node) {
        if (isServerActionFile(filename) && node.declaration.type === 'FunctionDeclaration') {
          const functionName = node.declaration.id?.name;
          if (functionName && isActionFunction(node.declaration)) {
            context.report({
              node,
              messageId: 'invalidServerActionExport',
              data: { actionName: functionName },
            });
          }
        }
        
        // Check for default exports in hooks
        if (isHookFile(filename) && node.declaration.type === 'FunctionDeclaration') {
          const functionName = node.declaration.id?.name;
          if (functionName && isHookFunction(node.declaration)) {
            context.report({
              node,
              messageId: 'invalidHookExport',
              data: { hookName: functionName },
            });
          }
        }
      },

      // Check for proper "use server" and "use client" directives
      Program(node) {
        const sourceCode = context.getSourceCode();
        const firstToken = sourceCode.getFirstToken(node);
        
        // Check for "use server" in server action files
        if (isServerActionFile(filename)) {
          const hasUseServer = node.body.some(statement => 
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'Literal' &&
            statement.expression.value === 'use server'
          );
          
          if (!hasUseServer) {
            context.report({
              node: firstToken,
              messageId: 'useServerMissingInActions',
            });
          }
        }
        
        // Check for "use client" in client component files that use hooks
        if (isClientFile(filename) && filename.endsWith('.tsx')) {
          const hasReactHooks = sourceCode.getText().includes('useState') ||
                                sourceCode.getText().includes('useEffect') ||
                                sourceCode.getText().includes('useTransition') ||
                                sourceCode.getText().includes('useCallback');
          
          if (hasReactHooks) {
            const hasUseClient = node.body.some(statement => 
              statement.type === 'ExpressionStatement' &&
              statement.expression.type === 'Literal' &&
              statement.expression.value === 'use client'
            );
            
            if (!hasUseClient) {
              context.report({
                node: firstToken,
                messageId: 'useClientMissingInComponents',
              });
            }
          }
        }
      },
    };
  },
});