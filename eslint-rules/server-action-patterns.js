const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/timfee/scheduler/blob/main/docs/adr-007-client-server-communication.md#${name}`
);

module.exports = createRule({
  name: 'server-action-patterns',
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce server action patterns as defined in ADR-007',
      recommended: 'error',
    },
    messages: {
      missingErrorHandling: 'Server action "{{actionName}}" should have try-catch error handling.',
      missingValidation: 'Server action "{{actionName}}" should validate input parameters.',
      missingCacheInvalidation: 'Server action "{{actionName}}" should invalidate cache after mutations.',
      inconsistentReturnType: 'Server action "{{actionName}}" should return consistent result type.',
      missingUseServerDirective: 'File with server actions should start with "use server" directive.',
      invalidActionNaming: 'Server action "{{actionName}}" should follow naming pattern: [verb][Feature]Action.',
      fetchInServerAction: 'Server actions should not use fetch() for internal operations. Use direct database calls or other server actions.',
      clientCodeInServerAction: 'Server action contains client-side code. Remove React hooks and client-side imports.',
      missingAsyncOnServerAction: 'Server action "{{actionName}}" should be async since it likely performs I/O operations.',
      hardcodedErrorMessages: 'Server action "{{actionName}}" should use mapErrorToUserMessage() for consistent error handling.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          requireValidation: {
            type: 'boolean',
            default: true,
            description: 'Require input validation in server actions',
          },
          requireCacheInvalidation: {
            type: 'boolean',
            default: true,
            description: 'Require cache invalidation in mutating server actions',
          },
          requireErrorHandling: {
            type: 'boolean',
            default: true,
            description: 'Require try-catch error handling in server actions',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      requireValidation: true,
      requireCacheInvalidation: true,
      requireErrorHandling: true,
    },
  ],
  create(context, [options]) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();
    
    function isServerActionFile(path) {
      return path.includes('/server/') && 
             (path.endsWith('/actions.ts') || path.endsWith('\\actions.ts'));
    }
    
    function isServerAction(node) {
      return node.type === 'FunctionDeclaration' && 
             node.id && 
             node.id.name.endsWith('Action');
    }
    
    function hasTryCatchBlock(node) {
      return node.body && node.body.body && 
             node.body.body.some(stmt => stmt.type === 'TryStatement');
    }
    
    function hasValidationCall(node) {
      const functionText = sourceCode.getText(node);
      return functionText.includes('safeParse') || 
             functionText.includes('parse') || 
             functionText.includes('validate');
    }
    
    function hasCacheInvalidation(node) {
      const functionText = sourceCode.getText(node);
      return functionText.includes('revalidatePath') || 
             functionText.includes('revalidateTag');
    }
    
    function isMutatingAction(node) {
      const actionName = node.id?.name || '';
      return actionName.startsWith('create') || 
             actionName.startsWith('update') || 
             actionName.startsWith('delete') || 
             actionName.startsWith('remove');
    }
    
    function hasClientImports(node) {
      const functionText = sourceCode.getText(node);
      return functionText.includes('useState') || 
             functionText.includes('useEffect') || 
             functionText.includes('useCallback') ||
             functionText.includes('from "react"');
    }
    
    function hasFetchCall(node) {
      const functionText = sourceCode.getText(node);
      return functionText.includes('fetch(');
    }
    
    function hasMapErrorToUserMessage(node) {
      const functionText = sourceCode.getText(node);
      return functionText.includes('mapErrorToUserMessage');
    }
    
    function hasHardcodedErrorMessages(node) {
      const functionText = sourceCode.getText(node);
      // Look for throw new Error with hardcoded strings
      return /throw new Error\s*\(\s*["'`][^"'`]+["'`]\s*\)/.test(functionText);
    }

    return {
      // Check for "use server" directive
      Program(node) {
        if (isServerActionFile(filename)) {
          const hasUseServer = node.body.some(statement => 
            statement.type === 'ExpressionStatement' &&
            statement.expression.type === 'Literal' &&
            statement.expression.value === 'use server'
          );
          
          if (!hasUseServer) {
            context.report({
              node: node.body[0] || node,
              messageId: 'missingUseServerDirective',
            });
          }
        }
      },

      // Check server action function patterns
      FunctionDeclaration(node) {
        if (!isServerActionFile(filename) || !isServerAction(node)) {
          return;
        }
        
        const actionName = node.id?.name || '';
        
        // Check naming pattern
        if (!/^[a-z]+[A-Z][a-zA-Z]*Action$/.test(actionName)) {
          context.report({
            node,
            messageId: 'invalidActionNaming',
            data: { actionName },
          });
        }
        
        // Check if function is async
        if (!node.async) {
          context.report({
            node,
            messageId: 'missingAsyncOnServerAction',
            data: { actionName },
          });
        }
        
        // Check for try-catch error handling
        if (options.requireErrorHandling && !hasTryCatchBlock(node)) {
          context.report({
            node,
            messageId: 'missingErrorHandling',
            data: { actionName },
          });
        }
        
        // Check for input validation
        if (options.requireValidation && !hasValidationCall(node)) {
          context.report({
            node,
            messageId: 'missingValidation',
            data: { actionName },
          });
        }
        
        // Check for cache invalidation in mutating actions
        if (options.requireCacheInvalidation && isMutatingAction(node) && !hasCacheInvalidation(node)) {
          context.report({
            node,
            messageId: 'missingCacheInvalidation',
            data: { actionName },
          });
        }
        
        // Check for client-side code in server actions
        if (hasClientImports(node)) {
          context.report({
            node,
            messageId: 'clientCodeInServerAction',
            data: { actionName },
          });
        }
        
        // Check for fetch calls (should use direct database calls)
        if (hasFetchCall(node)) {
          context.report({
            node,
            messageId: 'fetchInServerAction',
            data: { actionName },
          });
        }
        
        // Check for hardcoded error messages
        if (hasHardcodedErrorMessages(node) && !hasMapErrorToUserMessage(node)) {
          context.report({
            node,
            messageId: 'hardcodedErrorMessages',
            data: { actionName },
          });
        }
      },
    };
  },
});