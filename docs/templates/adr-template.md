# ADR-XXX: [Decision Title]

## Status

[Proposed | Accepted | Rejected | Superseded]

## Context

[Describe the situation and the architectural decision to be made. Include technical, business, and project context.]

## Decision

[State the architectural decision that was made. Be specific and clear about what was decided.]

## Consequences

### Positive

- **[Benefit 1]**: [Description of how this decision helps]
- **[Benefit 2]**: [Description of how this decision helps]
- **[Benefit 3]**: [Description of how this decision helps]

### Negative

- **[Cost 1]**: [Description of the trade-offs or downsides]
- **[Cost 2]**: [Description of the trade-offs or downsides]
- **[Cost 3]**: [Description of the trade-offs or downsides]

## Implementation

### Current State

[Describe how things work now, if applicable]

### Future State

[Describe how things will work after this decision is implemented]

### Examples

```typescript
// Example code demonstrating the decision
export function exampleFunction() {
  // Implementation following the decision
}
```

### Patterns to Follow

- **Pattern 1**: [Description of implementation pattern]
- **Pattern 2**: [Description of implementation pattern]
- **Pattern 3**: [Description of implementation pattern]

### Patterns to Avoid

- **Anti-pattern 1**: [Description of what not to do]
- **Anti-pattern 2**: [Description of what not to do]

## Alternatives Considered

### [Alternative 1]

- **Pros**: [Benefits of this alternative]
- **Cons**: [Drawbacks of this alternative]
- **Why rejected**: [Reason for not choosing this alternative]

### [Alternative 2]

- **Pros**: [Benefits of this alternative]
- **Cons**: [Drawbacks of this alternative]
- **Why rejected**: [Reason for not choosing this alternative]

## Implementation Strategy

### Phase 1: [Initial Implementation]

- [ ] [Specific task or milestone]
- [ ] [Specific task or milestone]
- [ ] [Specific task or milestone]

### Phase 2: [Broader Adoption]

- [ ] [Specific task or milestone]
- [ ] [Specific task or milestone]
- [ ] [Specific task or milestone]

### Phase 3: [Full Migration]

- [ ] [Specific task or milestone]
- [ ] [Specific task or milestone]
- [ ] [Specific task or milestone]

## Metrics and Success Criteria

### Success Metrics

- **[Metric 1]**: [How to measure success]
- **[Metric 2]**: [How to measure success]
- **[Metric 3]**: [How to measure success]

### Failure Indicators

- **[Indicator 1]**: [What would indicate the decision isn't working]
- **[Indicator 2]**: [What would indicate the decision isn't working]

## When to Reconsider

Consider revisiting this decision if:

- [Condition 1 that would trigger reconsideration]
- [Condition 2 that would trigger reconsideration]
- [Condition 3 that would trigger reconsideration]

## Enforcement

### Automated Checks

- **ESLint Rules**: [List any ESLint rules that enforce this decision]
- **Type Checking**: [List any TypeScript patterns that enforce this decision]
- **Tests**: [List any tests that validate this decision]

### Code Review Guidelines

- [Guideline 1 for reviewing code related to this decision]
- [Guideline 2 for reviewing code related to this decision]
- [Guideline 3 for reviewing code related to this decision]

## Related Decisions

- [ADR-XXX: Related Decision Title](./adr-xxx-related-decision.md)
- [ADR-XXX: Another Related Decision](./adr-xxx-another-decision.md)

## References

- [Link to relevant documentation]
- [Link to relevant resources]
- [Link to relevant discussions]

---

## Template Usage Notes

### How to Use This Template

1. **Copy this template** to create a new ADR
2. **Replace the placeholders** with actual content
3. **Number the ADR** using the next available number (e.g., ADR-008)
4. **Update the title** to reflect the decision being made
5. **Fill in all sections** with relevant information
6. **Review and refine** before marking as "Accepted"

### Writing Guidelines

- **Be specific**: Avoid vague language; be concrete about decisions
- **Include context**: Explain why this decision matters
- **Show examples**: Use code examples to illustrate patterns
- **Consider alternatives**: Document what else was considered
- **Think about enforcement**: How will this be maintained?
- **Link to related decisions**: Connect to other ADRs when relevant

### Common Sections to Adapt

- **Implementation**: May need more or fewer subsections depending on complexity
- **Alternatives**: Include as many as were seriously considered
- **Consequences**: Focus on the most important trade-offs
- **Enforcement**: Tailor to the specific decision being made

### File Naming Convention

- Use format: `adr-XXX-decision-title.md`
- Use kebab-case for the title part
- Number sequentially starting from 001
- Keep titles concise but descriptive

### Status Lifecycle

- **Proposed**: Initial draft, under discussion
- **Accepted**: Decision is made and being implemented
- **Rejected**: Decision was considered but not chosen
- **Superseded**: Replaced by a newer decision (link to the new one)
