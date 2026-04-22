import {
  context,
  propagation,
  Span,
  SpanKind,
  SpanOptions,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  BatchSpanProcessor,
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { OTEL_TRACES_URL } from "../constants";

const tracerName = "ThirdWheel.Mobile";

let initialized = false;

function initializeProvider() {
  if (initialized) {
    return;
  }

  const spanProcessors = [];

  if (__DEV__) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  if (OTEL_TRACES_URL) {
    spanProcessors.push(
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: OTEL_TRACES_URL,
        })
      )
    );
  }

  const provider = new BasicTracerProvider({
    spanProcessors,
  });

  trace.setGlobalTracerProvider(provider);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  initialized = true;
}

export function initializeOpenTelemetry() {
  initializeProvider();
}

export function startSpan(name: string, options?: SpanOptions): Span {
  initializeProvider();
  return trace.getTracer(tracerName).startSpan(name, options);
}

export function injectTraceHeaders(
  span: Span,
  headers: Record<string, string>
): Record<string, string> {
  initializeProvider();
  const carrier = { ...headers };
  propagation.inject(trace.setSpan(context.active(), span), carrier);
  return carrier;
}

export function markSpanError(span: Span, error: unknown) {
  const err =
    error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");

  span.recordException(err);
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: err.message,
  });
}

export function markSpanSuccess(span: Span) {
  span.setStatus({ code: SpanStatusCode.OK });
}

export async function withClientSpan<T>(
  name: string,
  options: SpanOptions,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = startSpan(name, {
    ...options,
    kind: options.kind ?? SpanKind.CLIENT,
  });

  try {
    const result = await fn(span);
    markSpanSuccess(span);
    return result;
  } catch (error) {
    markSpanError(span, error);
    throw error;
  } finally {
    span.end();
  }
}
