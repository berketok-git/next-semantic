/**
    URL: /api/vsearch/embed
    
    Searches for similar chunks of text in a Supabase database using cosine similarity.

    @param {Request} request - The incoming HTTP request object.

    @returns {Response} A response object containing a JSON array of matching text chunks.

*/
import { createClient } from "@supabase/supabase-js";
import readRequestBody from "@/lib/api/readRequestBody";
import getEmbedding from "@/lib/openAi/getEmbedding";

// Use Next.js edge runtime
export const config = {
    runtime: 'edge',
}

export default async function handler(request) {
    const MATCHES = 3; // max matches to return
    const THRESHOLD = 0.01; // similarity threshold

    try {
        const requestData = await readRequestBody(request);



        // Validate length
  

        const embedding = await getEmbedding(requestData.searchTerm);

        const supabase = createClient(process.env.NEXT_PUBLIC_SB_URL, process.env.SB_SERVICE_KEY);

        // Perform cosine similarity search via RPC call
        const { data: chunks, error } = await supabase.rpc("vector_search", {
            query_embedding: embedding,
            similarity_threshold: THRESHOLD,
            match_count: MATCHES
        });

        if (error) {
            console.error(error);
            throw new Error(error);
        }

        return new Response(JSON.stringify(chunks), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (err) {
        return new Response(`Server error: ${err.message}`, { status: 500 });
    }
}