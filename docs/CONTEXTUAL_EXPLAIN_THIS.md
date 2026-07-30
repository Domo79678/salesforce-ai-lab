# Contextual Explain This

Explain This supports two deterministic entry modes without adding another
metadata retrieval or explanation engine.

## Direct Launch

Direct navigation from All Tools, Explore More, or another normal workspace
link opens an empty search. Any previous recommendation context is cleared.

## Contextual Launch

Priority and recommendation actions may carry a structured context containing
the source workspace, source type, issue title and reason, identifiers,
metadata type, object and field API names, evidence, and the shared normalized
metadata snapshot.

Explain This displays that context above its existing search interface. It
automatically invokes the existing explanation only when:

- the entity type is a supported object or field;
- the required structured API names are present; and
- the object or field is confirmed in the supplied shared snapshot.

Incomplete or uncovered context remains visible and prefilled for review. The
workspace does not derive identifiers from display titles or invent missing
metadata.

## Navigation

Start New Explanation clears the selected issue and returns to blank search
mode. Back returns contextual launches to Daily Brief, Org Health, or Knowledge
Center when that origin is registered; Mission Control and unknown origins
return to the dashboard.

## Shared Architecture

- `recommendationWorkspaceService` defines the optional contextual payload.
- `copilotWorkspaceRouter` owns transient route context and dynamic component
  input.
- Existing recommendation producers supply their current normalized snapshot
  when it is already available.
- `explainThisWorkspace` continues to use `copilotIntelligence` for dependency
  and explanation analysis.
