import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils.js";

export function Loader({ className }) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export function NoDataFound({ title = "Nothing here yet", description, buttonText, buttonAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <span className="text-2xl">📭</span>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>}
      {buttonText && buttonAction && (
        <button
          onClick={buttonAction}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}

export function BackButton() {
  return (
    <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
      ← Back
    </button>
  );
}
