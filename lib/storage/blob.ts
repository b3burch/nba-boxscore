import { put, list } from "@vercel/blob";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { DailySnapshot } from "../types/snapshot";
import type { League } from "../nba/leagues";

const LOCAL_DIR = path.join(process.cwd(), ".snapshots");

function blobLatestPath(league: League): string {
  return `snapshots/${league}/latest.json`;
}

function blobDatedPath(league: League, date: string): string {
  return `snapshots/${league}/${date}.json`;
}

function localLatestPath(league: League): string {
  return path.join(LOCAL_DIR, league, "latest.json");
}

function localDatedPath(league: League, date: string): string {
  return path.join(LOCAL_DIR, league, `${date}.json`);
}

export async function writeSnapshot(snap: DailySnapshot): Promise<void> {
  const body = JSON.stringify(snap, null, 2);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(blobLatestPath(snap.league), body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await put(blobDatedPath(snap.league, snap.dateEt), body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return;
  }
  await mkdir(path.join(LOCAL_DIR, snap.league), { recursive: true });
  await writeFile(localLatestPath(snap.league), body, "utf8");
  await writeFile(localDatedPath(snap.league, snap.dateEt), body, "utf8");
}

export async function readLatestSnapshot(
  league: League
): Promise<DailySnapshot | null> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: blobLatestPath(league), limit: 1 });
      if (blobs.length === 0) return null;
      const res = await fetch(blobs[0].url, { cache: "no-store" });
      if (!res.ok) return null;
      return (await res.json()) as DailySnapshot;
    } catch {
      return null;
    }
  }
  try {
    const body = await readFile(localLatestPath(league), "utf8");
    return JSON.parse(body) as DailySnapshot;
  } catch {
    return null;
  }
}
