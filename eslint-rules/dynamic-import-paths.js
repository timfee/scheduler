const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/timfee/scheduler/blob/main/docs/adr-006-file-organization-patterns.md#${name}`
);

module.exports = createRule({
  name: 'dynamic-import-paths',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce absolute paths with @/ alias for dynamic imports in production code',
      recommended: 'error',
    },
    messages: {
      relativeDynamicImport: 'Dynamic import should use absolute path with @/ alias instead of relative path "{{path}}".',
      parentDirectoryImport: 'Dynamic import should not use parent directory paths (../). Use @/ alias instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowTestFiles: {
            type: 'boolean',
            default: true,
            description: 'Allow relative dynamic imports in test files',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      allowTestFiles: true,
    },
  ],
  create(context, [options]) {
    const filename = context.getFilename();
    
    function isTestFile(path) {
      return path.includes('__tests__') || 
             path.includes('test/') || 
             path.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/);
    }
    
    function isRelativePath(path) {
      return path.startsWith('./') || path.startsWith('../');
    }
    
    function isParentDirectoryPath(path) {
      return path.startsWith('../');
    }

    return {
      // Handle dynamic imports: import('path')
      ImportExpression(node) {
        // Skip test files if configured to allow them
        if (options.allowTestFiles && isTestFile(filename)) {
          return;
        }
        
        if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
          const importPath = node.source.value;
          
          if (isRelativePath(importPath)) {
            if (isParentDirectoryPath(importPath)) {
              context.report({
                node: node.source,
                messageId: 'parentDirectoryImport',
                data: { path: importPath },
              });
            } else {
              context.report({
                node: node.source,
                messageId: 'relativeDynamicImport',
                data: { path: importPath },
              });
            }
          }
        }
      },
    };
  },
});
