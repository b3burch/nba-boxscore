import { put, list } from "@vercel/blob";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { DailySnapshot } from "../types/snapshot";

const LATEST_PATH = "snapshots/latest.json";
const LOCAL_DIR = path.join(process.cwd(), ".snapshots");
const LOCAL_LATEST = path.join(LOCAL_DIR, "latest.json");

export async function writeSnapshot(snap: DailySnapshot): Promise<void> {
  const body = JSON.stringify(snap, null, 2);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(LATEST_PATH, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await put(`snapshots/${snap.dateEt}.json`, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_LATEST, body, "utf8");
  await writeFile(path.join(LOCAL_DIR, `${snap.dateEt}.json`), body, "utf8");
}

export async function readLatestSnapshot(): Promise<DailySnapshot | null> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: LATEST_PATH, limit: 1 });
      if (blobs.length === 0) return null;
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as DailySnapshot;
    } catch {
      return null;
    }
  }
  try {
    const body = await readFile(LOCAL_LATEST, "utf8");
    return JSON.parse(body) as DailySnapshot;
  } catch {
    return null;
  }
}
