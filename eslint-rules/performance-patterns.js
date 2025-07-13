const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/timfee/scheduler/blob/main/docs/architecture/adr-012-performance-optimization.md#${name}`
);

module.exports = createRule({
  name: 'performance-patterns',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce performance best practices as defined in ADR-012',
      recommended: 'warn',
    },
    messages: {
      syncDatabaseCall: 'Avoid synchronous database calls. Use async/await pattern instead.',
      missingPagination: 'Database queries without limits may cause performance issues. Consider adding pagination.',
      inefficientReactKey: 'Using array index as React key may cause performance issues. Use stable unique identifiers.',
      missingMemo: 'Consider using React.memo for potentially expensive components.',
      inefficientMapInRender: 'Avoid creating new arrays/objects in render. Move to useMemo or useState.',
      unboundedLoop: 'Potential unbounded loop detected. Consider adding limits or pagination.',
      largeBundle: 'Large import detected. Consider dynamic imports or tree shaking.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxQueryResults: {
            type: 'number',
            default: 100,
            description: 'Maximum number of results for database queries without pagination',
          },
          warnOnLargeImports: {
            type: 'boolean',
            default: true,
            description: 'Warn when importing large libraries',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      maxQueryResults: 100,
      warnOnLargeImports: true,
    },
  ],
  create(context, [options]) {
    const sourceCode = context.getSourceCode();
    
    // Large libraries that should be imported selectively
    const largeLibraries = [
      'lodash',
      'date-fns',
      'moment',
      'antd',
      'react-router-dom',
    ];
    
    return {
      // Check for synchronous database calls
      CallExpression(node) {
        if (node.callee.type === 'MemberExpression' &&
            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'run') {
          
          // Check if this is inside an async function or has await
          let parent = node.parent;
          let hasAwait = false;
          
          while (parent) {
            if (parent.type === 'AwaitExpression') {
              hasAwait = true;
              break;
            }
            parent = parent.parent;
          }
          
          if (!hasAwait) {
            context.report({
              node,
              messageId: 'syncDatabaseCall',
            });
          }
        }
      },
      
      // Check for database queries without limits
      'CallExpression[callee.property.name="select"]'(node) {
        const text = sourceCode.getText(node.parent);
        
        if (!text.includes('.limit(') && !text.includes('.take(')) {
          context.report({
            node,
            messageId: 'missingPagination',
          });
        }
      },
      
      // Check for array index as React key
      'JSXAttribute[name.name="key"]'(node) {
        if (node.value && 
            node.value.type === 'JSXExpressionContainer' &&
            node.value.expression) {
          
          const keyExpr = node.value.expression;
          
          // Check for patterns like key={index} or key={i}
          if (keyExpr.type === 'Identifier' && 
              (keyExpr.name === 'index' || keyExpr.name === 'i')) {
            context.report({
              node,
              messageId: 'inefficientReactKey',
            });
          }
        }
      },
      
      // Check for .map() calls in JSX that create new objects
      'JSXExpressionContainer CallExpression[callee.property.name="map"]'(node) {
        if (node.arguments[0] && 
            node.arguments[0].type === 'ArrowFunctionExpression' &&
            node.arguments[0].body.type === 'ObjectExpression') {
          
          context.report({
            node,
            messageId: 'inefficientMapInRender',
          });
        }
      },
      
      // Check for while loops without clear bounds
      WhileStatement(node) {
        const text = sourceCode.getText(node);
        
        if (!text.includes('limit') && 
            !text.includes('count') && 
            !text.includes('length') &&
            !text.includes('break')) {
          context.report({
            node,
            messageId: 'unboundedLoop',
          });
        }
      },
      
      // Check for large library imports
      ImportDeclaration(node) {
        if (!options.warnOnLargeImports) return;
        
        const importPath = node.source.value;
        
        if (typeof importPath === 'string') {
          const isLargeLibrary = largeLibraries.some(lib => 
            importPath === lib || importPath.startsWith(`${lib}/`)
          );
          
          if (isLargeLibrary && 
              node.specifiers.length > 0 &&
              node.specifiers[0].type === 'ImportNamespaceSpecifier') {
            context.report({
              node,
              messageId: 'largeBundle',
            });
          }
        }
      },
    };
  },
});