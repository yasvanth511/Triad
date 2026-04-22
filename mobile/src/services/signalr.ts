import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { getToken } from "./api";
import { SIGNALR_URL } from "../constants";
import type { Message } from "../types";
import { injectTraceHeaders, withClientSpan } from "./otel";
import { SpanKind } from "@opentelemetry/api";

let connection: HubConnection | null = null;

export async function getConnection(): Promise<HubConnection> {
  if (connection) return connection;

  return withClientSpan(
    "signalr.connect",
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "messaging.system": "signalr",
        "server.address": SIGNALR_URL,
      },
    },
    async (span) => {
      const token = await getToken();

      connection = new HubConnectionBuilder()
        .withUrl(SIGNALR_URL, {
          accessTokenFactory: async () => (await getToken()) || token || "",
          headers: injectTraceHeaders(span, {}),
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build();

      connection.onreconnecting((error) => {
        void withClientSpan(
          "signalr.reconnecting",
          {
            kind: SpanKind.CLIENT,
            attributes: {
              "messaging.system": "signalr",
              "server.address": SIGNALR_URL,
            },
          },
          async () => {
            if (error) {
              throw error;
            }
          }
        );
      });

      connection.onreconnected(() => {
        void withClientSpan(
          "signalr.reconnected",
          {
            kind: SpanKind.CLIENT,
            attributes: {
              "messaging.system": "signalr",
              "server.address": SIGNALR_URL,
            },
          },
          async () => undefined
        );
      });

      await connection.start();
      return connection;
    }
  );
}

export async function joinMatch(matchId: string) {
  return withClientSpan(
    "signalr.join_match",
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "messaging.system": "signalr",
        "triad.match.id": matchId,
      },
    },
    async () => {
      const conn = await getConnection();
      await conn.invoke("JoinMatch", matchId);
    }
  );
}

export async function leaveMatch(matchId: string) {
  return withClientSpan(
    "signalr.leave_match",
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "messaging.system": "signalr",
        "triad.match.id": matchId,
      },
    },
    async () => {
      const conn = await getConnection();
      await conn.invoke("LeaveMatch", matchId);
    }
  );
}

export async function sendRealtimeMessage(matchId: string, content: string) {
  return withClientSpan(
    "signalr.send_message",
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "messaging.system": "signalr",
        "triad.match.id": matchId,
        "messaging.message.body.size": content.length,
      },
    },
    async () => {
      const conn = await getConnection();
      await conn.invoke("SendMessage", matchId, content);
    }
  );
}

export function onMessage(callback: (message: Message) => void) {
  if (!connection) return;
  connection.on("ReceiveMessage", callback);
}

export function offMessage(callback: (message: Message) => void) {
  if (!connection) return;
  connection.off("ReceiveMessage", callback);
}

export function onMessageError(callback: (error: string) => void) {
  if (!connection) return;
  connection.on("MessageError", callback);
}

export async function disconnect() {
  if (connection) {
    await withClientSpan(
      "signalr.disconnect",
      {
        kind: SpanKind.CLIENT,
        attributes: {
          "messaging.system": "signalr",
          "server.address": SIGNALR_URL,
        },
      },
      async () => {
        await connection!.stop();
        connection = null;
      }
    );
  }
}
