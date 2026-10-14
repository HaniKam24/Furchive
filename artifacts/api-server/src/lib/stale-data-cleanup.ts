import { lt, or, isNotNull } from "drizzle-orm";
import { db, sessions, petShareLinks } from "@workspace/db";
import { logger } from "./logger";

// Two tables accumulate inert rows forever with nothing to clean them up —
// an expired login session, and a sitter share link that's expired or been
// revoked. Neither is sensitive or usable once stale (the app already
// refuses to honor either — see docs/data-retention-policy.md), so there's
// no urgency, just tidiness. This app deliberately has no job scheduler at
// all (no cron service in render.yaml — see the Care Recommendations
// Engine's own file-level note on why: "re-run on the mutations that
// matter" instead of a cron). A cleanup sweep has no single mutation to
// hook onto, so instead it rides along on ordinary request traffic with low
// probability — same "no scheduler needed" philosophy, just triggered by
// "the app is being used" rather than one specific action.
const CLEANUP_PROBABILITY = 0.01;

export function maybePruneStaleRows(): void {
  if (Math.random() >= CLEANUP_PROBABILITY) return;
  // Fire-and-forget — never block the request that happened to trigger
  // this on a cleanup sweep.
  pruneStaleRows().catch((err) => logger.error({ err }, "Stale-row cleanup failed"));
}

async function pruneStaleRows(): Promise<void> {
  const now = new Date();
  const [deletedSessions, deletedShareLinks] = await Promise.all([
    db.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id }),
    db
      .delete(petShareLinks)
      .where(or(lt(petShareLinks.expiresAt, now), isNotNull(petShareLinks.revokedAt)))
      .returning({ id: petShareLinks.id }),
  ]);
  if (deletedSessions.length > 0 || deletedShareLinks.length > 0) {
    logger.info(
      { expiredSessions: deletedSessions.length, staleShareLinks: deletedShareLinks.length },
      "Pruned stale session and share-link rows",
    );
  }
}
