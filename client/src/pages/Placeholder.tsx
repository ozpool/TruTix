import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";

/// Fallback for unbuilt routes and unknown URLs.
export function Placeholder({ title }: { title: string }) {
  return (
    <EmptyState
      title={title}
      hint="There's nothing here yet."
      action={
        <ButtonLink to="/" variant="secondary">
          Back home
        </ButtonLink>
      }
    />
  );
}
