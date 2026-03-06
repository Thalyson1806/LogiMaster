import * as signalR from "@microsoft/signalr";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:5000";


let connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/packing-list`)
      .withAutomaticReconnect()
      .build();
  }
  return connection;
}

export async function startConnection(): Promise<void> {
  const conn = getConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log("SignalR conectado!");
    } catch (err) {
      console.error("Erro ao conectar SignalR:", err);
    }
  }
}

export function onPackingListUpdated(
  callback: (data: { id: number; code: string; status: string; customerName: string }) => void
): void {
  const conn = getConnection();
  conn.on("PackingListUpdated", callback);
}

export function offPackingListUpdated(): void {
  const conn = getConnection();
  conn.off("PackingListUpdated");
}

export interface DriverLocation {
  packingListId: number;
  code: string;
  driverName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export function onDriverLocationUpdated(callback: (data: DriverLocation) => void): void {
  const conn = getConnection();
  conn.on("DriverLocationUpdated", callback);
}

export function offDriverLocationUpdated(): void {
  const conn = getConnection();
  conn.off("DriverLocationUpdated");
}
