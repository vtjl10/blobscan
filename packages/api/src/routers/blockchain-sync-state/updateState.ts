import { TRPCError } from "@trpc/server";

import { z } from "@blobscan/zod";

import { createAuthedProcedure } from "../../procedures";
import { blockHashSchema, blockNumberSchema, slotSchema } from "../../utils";
import { BASE_PATH } from "./common";

export const inputSchema = z.object({
  lastLowerSyncedSlot: slotSchema.optional(),
  lastUpperSyncedSlot: slotSchema.optional(),
  lastFinalizedBlock: blockNumberSchema.optional(),
  lastUpperSyncedBlockRoot: blockHashSchema.optional(),
  lastUpperSyncedBlockSlot: slotSchema.optional(),
});

export const outputSchema = z.void();

export const updateState = createAuthedProcedure("indexer")
  .meta({
    openapi: {
      method: "PUT",
      path: BASE_PATH,
      tags: ["indexer"],
      summary: "updates the blockchain sync state.",
      protect: true,
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .mutation(
    async ({
      ctx,
      input: {
        lastLowerSyncedSlot,
        lastUpperSyncedSlot,
        lastFinalizedBlock,
        lastUpperSyncedBlockRoot,
        lastUpperSyncedBlockSlot,
      },
    }) => {
      if (
        lastLowerSyncedSlot !== undefined &&
        lastUpperSyncedSlot !== undefined &&
        lastLowerSyncedSlot > lastUpperSyncedSlot
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Last lower synced slot must be less than or equal to last upper synced slot",
        });
      }

      await ctx.prisma.blockchainSyncState.upsert({
        where: { id: 1 },
        update: {
          lastLowerSyncedSlot,
          lastUpperSyncedSlot,
          lastFinalizedBlock,
          lastUpperSyncedBlockRoot,
          lastUpperSyncedBlockSlot,
        },
        create: {
          id: 1,
          lastLowerSyncedSlot,
          lastUpperSyncedSlot,
          lastFinalizedBlock,
          lastUpperSyncedBlockRoot,
          lastUpperSyncedBlockSlot,
        },
      });
    }
  );
