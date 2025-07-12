module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce using alias imports (@/) instead of relative imports',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: 'code',
    schema: [{
      type: 'object',
      properties: {
        allowSameDirectoryImports: {
          type: 'boolean',
          default: true,
        },
      },
      additionalProperties: false,
    }],
  },
  create(context) {
    const options = context.options[0] || {};
    const allowSameDirectoryImports = options.allowSameDirectoryImports !== false;
    
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        
        // Skip if not a relative import
        if (!source.startsWith('./') && !source.startsWith('../')) {
          return;
        }
        
        // Allow same directory imports if configured
        if (allowSameDirectoryImports && source.startsWith('./') && !source.includes('/', 2)) {
          return;
        }
        
        // Check if this is a parent directory import
        if (source.startsWith('../')) {
          context.report({
            node: node.source,
            message: `Use alias import (@/) instead of relative import "${source}". Consider using the full path from the project root.`,
            fix(fixer) {
              const currentFile = context.getFilename();
              const relativePath = require('path').relative(process.cwd(), currentFile);
              const currentDir = require('path').dirname(relativePath);
              
              // Resolve the path
              let resolvedPath = require('path').resolve(currentDir, source);
              resolvedPath = require('path').relative(process.cwd(), resolvedPath);
              
              // Convert to alias path
              const aliasPath = '@/' + resolvedPath.replace(/\\/g, '/');
              
              return fixer.replaceText(node.source, `"${aliasPath}"`);
            },
          });
        }
        
        // Check if this is a same directory import that should use alias
        if (source.startsWith('./') && source.includes('/', 2)) {
          context.report({
            node: node.source,
            message: `Use alias import (@/) instead of relative import "${source}". Consider using the full path from the project root.`,
            fix(fixer) {
              // For same directory deeper imports, construct the full path
              const currentFile = context.getFilename();
              const relativePath = require('path').relative(process.cwd(), currentFile);
              const currentDir = require('path').dirname(relativePath);
              
              // Resolve the path
              let resolvedPath = require('path').resolve(currentDir, source);
              resolvedPath = require('path').relative(process.cwd(), resolvedPath);
              
              // Convert to alias path
              const aliasPath = '@/' + resolvedPath.replace(/\\/g, '/');
              
              return fixer.replaceText(node.source, `"${aliasPath}"`);
            },
          });
        }
      },
    };
  },
};