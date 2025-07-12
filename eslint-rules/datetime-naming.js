const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/timfee/scheduler/blob/main/docs/DATETIME_NAMING_CONVENTIONS.md#${name}`
);

module.exports = createRule({
  name: 'datetime-naming',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce consistent date/time variable naming conventions',
      recommended: 'recommended',
    },
    messages: {
      ambiguousDateTime: 'Ambiguous date/time variable name "{{name}}". Use more specific names like "{{suggestions}}".',
      inconsistentUtc: 'UTC timestamp "{{name}}" should use "Utc" suffix (PascalCase). Consider "{{suggestion}}".',
      inconsistentTimeZone: 'Timezone variable "{{name}}" should use "timeZone" or "TimeZone" pattern. Consider "{{suggestion}}".',
      unclearFormat: 'Variable "{{name}}" contains date/time terms but format is unclear. Consider more specific names.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowAmbiguous: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of variable names that are allowed to be ambiguous',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [
    {
      allowAmbiguous: ['date', 'time', 'timestamp'], // Allow these in some contexts
    },
  ],
  create(context, [options]) {
    const allowAmbiguous = options.allowAmbiguous || [];

    function checkVariableName(name, node) {
      // Skip if explicitly allowed
      if (allowAmbiguous.includes(name)) {
        return;
      }

      // Check for ambiguous date/time names (but allow common parameter names)
      if ((name === 'date' || name === 'time' || name === 'timestamp')) {
        // Allow these names in function parameters and destructuring
        const isParameter = node.parent && (
          node.parent.type === 'FunctionDeclaration' ||
          node.parent.type === 'ArrowFunctionExpression' ||
          (node.parent.type === 'Property' && node.parent.parent && node.parent.parent.type === 'ObjectPattern')
        );
        
        if (!isParameter) {
          context.report({
            node,
            messageId: 'ambiguousDateTime',
            data: {
              name,
              suggestions: name === 'date' ? 'selectedDate, bookingDate, startDate' :
                          name === 'time' ? 'startTime, endTime, displayTime' :
                          'createdTimestamp, lastModifiedTimestamp',
            },
          });
          return;
        }
      }

      // Check for UTC timestamp naming - but skip if already correct
      if (name.toLowerCase().includes('utc') && !name.endsWith('Utc') && !name.includes('Utc')) {
        const suggestion = name.replace(/[Uu][Tt][Cc]/g, 'Utc');
        context.report({
          node,
          messageId: 'inconsistentUtc',
          data: {
            name,
            suggestion,
          },
        });
        return;
      }

      // Check for timezone naming - improved logic
      if ((name.toLowerCase().includes('timezone') || name.toLowerCase().includes('zone')) && 
          !name.includes('timeZone') && !name.includes('TimeZone') && !name.includes('TIME_ZONE')) {
        let suggestion = name;
        if (name.toLowerCase().includes('timezone')) {
          suggestion = name.replace(/[Tt]imezone/g, 'timeZone');
        } else if (name.toLowerCase().includes('zone')) {
          suggestion = name.replace(/[Zz]one/g, 'Zone');
        }
        context.report({
          node,
          messageId: 'inconsistentTimeZone',
          data: {
            name,
            suggestion,
          },
        });
        return;
      }

      // Check for unclear date/time format
      const dateTimePattern = /\b(date|time|timestamp)\b/i;
      if (dateTimePattern.test(name) && name.length < 4) {
        context.report({
          node,
          messageId: 'unclearFormat',
          data: {
            name,
          },
        });
      }
    }

    return {
      VariableDeclarator(node) {
        if (node.id.type === 'Identifier') {
          checkVariableName(node.id.name, node.id);
        }
      },
      Property(node) {
        if (node.key.type === 'Identifier') {
          checkVariableName(node.key.name, node.key);
        }
      },
      FunctionDeclaration(node) {
        if (node.id) {
          checkVariableName(node.id.name, node.id);
        }
        node.params.forEach(param => {
          if (param.type === 'Identifier') {
            checkVariableName(param.name, param);
          }
        });
      },
      ArrowFunctionExpression(node) {
        node.params.forEach(param => {
          if (param.type === 'Identifier') {
            checkVariableName(param.name, param);
          }
        });
      },
    };
  },
});