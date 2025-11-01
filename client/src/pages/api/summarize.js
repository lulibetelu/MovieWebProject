import NLPCloudClient from "nlpcloud";

export const prerender = false;

const client = new NLPCloudClient({
    model: "bart-large-cnn",
    token: import.meta.env.NLPCLOUD_TOKEN,
});

export async function POST({ request }) {
    const requestData = await request.json();
    const reviewsText = requestData.text;

    try {
        const summary = await client.summarization({
            text: reviewsText,
        });

        return new Response(
            JSON.stringify({
                summary: summary.data.summary_text,
            }),
            {
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (err) {
        console.error("Error al resumir:", err);
        return new Response(
            JSON.stringify({
                error: true,
                message: err.message,
            }),
            { status: 500 },
        );
    }
}
