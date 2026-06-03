import { getResponse } from "~/server/ai/completions";
import { createTRPCRouter, publicProcedure } from "../../trpc";


export const aiRouter = createTRPCRouter({
    testOpenrouter: publicProcedure.query(async () => {
        const response = await getResponse();
        return response;
    }),
});