import { LogLevel, log } from '.';
import { SerializableLogFields } from './log';
import { v4 as uuidv4 } from 'uuid';

type SpanInfo = {
  name: string;
  id: string;
  level: LogLevel;
  fields?: SerializableLogFields;
  startTimeInterval?: number;
  startTimeMs: number;
  parentSpanID?: string;
};

type Span = {
  id: string;
  end: (result: SpanResult, endTimeInterval?: number) => void;
};

type SpanResult = 'success' | 'failure' | 'error' | 'cancelled' | 'unknown';

/**
 * Signals that an operation has started at this point in time. Each operation consists of start and
 * end event logs. The start event is emitted immediately upon calling the `startSpan(...)` method,
 * while the corresponding end event is emitted when the `end(...)` method is called on the `Span`
 * returned from the method. Refer to `Span` for more details.
 *
 * @param name - The name of the operation.
 * @param level - The severity of the log to use when emitting logs for the operation.
 * @param fields - The extra fields to send as part of start and end logs for the operation.
 * @param startTime - An optional custom start time in milliseconds. This can be
 *                    used to override the default start time of the span. If provided, it needs
 *                    to be used in combination with an `endTimeMs`. Providing one and not the other is
 *                    considered an error and in that scenario, the default clock will be used instead.
 * @param parentSpanID - An optional ID of the parent span, used to build span hierarchies. A span without a
 *                       parentSpanID is considered a root span.
 *
 * @returns A span that can be used to signal the end of the operation if the Capture SDK has been
 *          configured.
 */
export function startSpan(
  name: string,
  level: LogLevel,
  fields?: SerializableLogFields,
  startTimeInterval?: number,
  parentSpanID?: string,
): Span {
  const spanUuid = uuidv4();

  const startSpanFields = {
    ...fields,
    ...{ _span_id: spanUuid, _span_name: name, _span_type: 'start' },
    ...parentSpanID ? { _parent_span_id: parentSpanID } : {},
  };

  log(level, ``, startSpanFields);

  const span = {
    name,
    id: spanUuid,
    level,
    fields,
    startTimeInterval,
    parentSpanID,
    startTimeMs: performance.now(),
  };

  return {
    id: span.id,
    end: (result: SpanResult, endTimeInterval?: number) => endSpan(span, result, endTimeInterval),
  };
}

function endSpan(
  span: SpanInfo,
  result: 'success' | 'failure' | 'error' | 'cancelled' | 'unknown',
  endTimeInterval?: number,
): void {
  let duration;
  if (endTimeInterval !== undefined && span.startTimeInterval !== undefined) {
    duration = endTimeInterval - span.startTimeInterval;
  } else {
    duration = performance.now() - span.startTimeMs;
  }

  let end_span_fields = {
    ...span.fields,
    ...{
      _span_id: span.id,
      _span_name: span.name,
      _span_type: 'end',
      _span_result: result,
    },
    ...{ '_span_parent_id': span.parentSpanID },
    ...{ '_duration_ms': duration },
    ...{ _duration_ms: duration },
  };

  log(span.level, ``, end_span_fields);
}
