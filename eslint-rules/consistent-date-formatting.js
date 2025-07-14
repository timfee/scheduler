const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/timfee/scheduler/blob/main/docs/adr-008-date-time-handling.md#${name}`
);

module.exports = createRule({
  name: 'consistent-date-formatting',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent date formatting patterns as defined in ADR-008',
      recommended: 'recommended',
    },
    messages: {
      useFormatDateForApi: 'Use formatDateForApi() instead of format() for API date formatting. Found: "{{pattern}}"',
      useCreateDateRange: 'Use createDateRange() utility instead of manually creating date ranges with addDays/startOfDay.',
      hardcodedDateFormat: 'Avoid hardcoded date format strings. Use utility functions or constants.',
      inconsistentApiFormat: 'API date format should be consistent. Use formatDateForApi() utility.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.getSourceCode();
    
    function isApiDateFormat(formatString) {
      return formatString.includes("yyyy-MM-dd'T'HH:mm:ssXXX");
    }
    
    function hasManualDateRangePattern(node) {
      const text = sourceCode.getText(node.parent);
      return text.includes('addDays') && text.includes('startOfDay') && text.includes('format');
    }

    return {
      // Check for format() calls with API date patterns
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'format') {
          const formatArg = node.arguments[1];
          if (formatArg && formatArg.type === 'Literal' && typeof formatArg.value === 'string') {
            const pattern = formatArg.value;
            
            // Skip if this is in the date-range utility file
            const filename = context.getFilename();
            if (filename.includes('date-range.ts')) {
              return;
            }
            
            // Skip if this is in a utility function
            const ancestors = sourceCode.getAncestors(node);
            const functionName = ancestors
              .find(ancestor => ancestor.type === 'FunctionDeclaration')?.id?.name;
            
            if (functionName === 'formatDateForApi' || functionName === 'createDateRange') {
              return;
            }
            
            // Check for API date format pattern
            if (isApiDateFormat(pattern)) {
              context.report({
                node,
                messageId: 'useFormatDateForApi',
                data: { pattern },
              });
            }
            
            // Check for manual date range creation
            if (hasManualDateRangePattern(node)) {
              context.report({
                node,
                messageId: 'useCreateDateRange',
              });
            }
          }
        }
      },
      
      // Check for hardcoded date format strings
      Literal(node) {
        if (typeof node.value === 'string' && node.value.includes('yyyy-MM-dd')) {
          // Skip if this is in a utility function or constant
          const ancestors = sourceCode.getAncestors(node);
          const functionName = ancestors
            .find(ancestor => ancestor.type === 'FunctionDeclaration')?.id?.name;
          
          if (functionName === 'formatDateForApi' || functionName === 'createDateRange') {
            return;
          }
          
          // Skip if this is in the date-range utility file
          const filename = context.getFilename();
          if (filename.includes('date-range.ts')) {
            return;
          }
          
          context.report({
            node,
            messageId: 'hardcodedDateFormat',
          });
        }
      },
      
      // Check for inconsistent API date formatting
      VariableDeclarator(node) {
        if (node.init && node.init.type === 'CallExpression') {
          const callExpression = node.init;
          if (callExpression.callee.type === 'Identifier' && callExpression.callee.name === 'format') {
            const formatArg = callExpression.arguments[1];
            if (formatArg && formatArg.type === 'Literal' && typeof formatArg.value === 'string') {
              const pattern = formatArg.value;
              
              // Check for API-like patterns that should use utility
              if (pattern.includes('T') && pattern.includes('XXX')) {
                context.report({
                  node,
                  messageId: 'inconsistentApiFormat',
                });
              }
            }
          }
        }
      },
    };
  },
});