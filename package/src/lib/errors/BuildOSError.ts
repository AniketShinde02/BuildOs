/**
 * Production-grade structured error diagnostic library for BuildOS.
 * Enforces zero swallowed exceptions and comprehensive debugging context per RC-3 Directive.
 */

export type ErrorSource = 
  | "OAuth" 
  | "Adapter" 
  | "Database" 
  | "Docker" 
  | "ImageEngine" 
  | "PublishPipeline" 
  | "UI"
  | "Network";

export interface ErrorDiagnostic {
  message: string;
  source: ErrorSource;
  stack?: string;
  adapter?: string;
  endpoint?: string;
  payload?: any;
  rootCause: string;
  suggestedFix: string;
  retryOption: boolean;
  logsLink?: string;
  timestamp: string;
}

export class BuildOSError extends Error {
  public diagnostic: ErrorDiagnostic;

  constructor({
    message,
    source,
    adapter,
    endpoint,
    payload,
    rootCause,
    suggestedFix,
    retryOption = false,
    logsLink = "/accounts",
    stack,
  }: Omit<ErrorDiagnostic, "timestamp">) {
    super(message);
    this.name = "BuildOSError";
    
    this.diagnostic = {
      message,
      source,
      adapter: adapter || "Core",
      endpoint: endpoint || "N/A",
      payload: payload ? JSON.parse(JSON.stringify(payload)) : undefined,
      rootCause,
      suggestedFix,
      retryOption,
      logsLink,
      timestamp: new Date().toISOString(),
      stack: stack || this.stack,
    };
  }

  /**
   * Format error into standard JSON payload for API responses and audit logs.
   */
  public toJSON(): ErrorDiagnostic {
    return this.diagnostic;
  }

  /**
   * Helper to normalize arbitrary unknowns or native Errors into valid BuildOSError instances.
   */
  public static fromError(err: unknown, defaultSource: ErrorSource = "Adapter", context?: Partial<ErrorDiagnostic>): BuildOSError {
    if (err instanceof BuildOSError) {
      return err;
    }

    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;

    return new BuildOSError({
      message,
      source: defaultSource,
      rootCause: message || "Unknown runtime exception during workflow execution.",
      suggestedFix: context?.suggestedFix || "Check container connectivity, verify API credentials, and review error logs.",
      retryOption: context?.retryOption ?? true,
      adapter: context?.adapter,
      endpoint: context?.endpoint,
      payload: context?.payload,
      logsLink: context?.logsLink || "/accounts",
      stack,
    });
  }
}
