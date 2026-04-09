import { GoogleGenerativeAI } from '@google/generative-ai';
import { Client } from 'pg';
import axios from 'axios';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return Response.json({ error: 'Missing query parameter q' }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const SERPER_API_KEY = process.env.SERPER_API_KEY;
    const DATABASE_URL = process.env.DATABASE_URL;

    try {
        // 1. Serper.dev Video Search
        console.log(`Searching for: ${q}`);
        const serperResponse = await axios.post('https://google.serper.dev/videos', {
            q: `${q} bollywood song`,
            num: 5
        }, {
            headers: {
                'X-API-KEY': SERPER_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const youtube_results = (serperResponse.data.videos || []).slice(0, 5).map(v => ({
            title: v.title,
            channel: v.channel || 'YouTube',
            url: v.link
        }));

        // 2. Gemini Metadata Extraction
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const resultsText = youtube_results.length > 0
            ? youtube_results.map((r, i) => `${i + 1}. "${r.title}" — ${r.channel}`).join('\n')
            : "No direct search results found.";

        const prompt = `You are a Bollywood music expert. The user sang or spoke these lyrics:
"${q}"

YouTube search results for these lyrics:
${resultsText}

Identify the most likely Bollywood song and its creators. 
*IF search results are empty, use your internal knowledge of Hindi/Bollywood music to identify the song from the lyrics.*

Include ALL creators (Singers, Composers, Lyricists, etc.) and their specific roles.

Return ONLY a valid JSON object (no markdown, no backticks):
{
  "singer_name": "Primary singer name",
  "song_title": "Song title",
  "movie": "Movie or album",
  "year": "Release year",
  "genre": "Genre",
  "era": "80s / 90s / 2000s / 2010s / 2020s",
  "creators": [
    { "name": "Name 1", "role": "Singer" },
    { "name": "Name 2", "role": "Singer" },
    { "name": "Name 3", "role": "Composer" },
    { "name": "Name 4", "role": "Lyricist" }
  ],
  "bio": "2-3 sentence bio of the song/singer",
  "confidence": "high / medium / low"
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let singer_metadata;
        try {
            const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            singer_metadata = JSON.parse(jsonStr);
        } catch (e) {
            singer_metadata = { raw_response: responseText };
        }

        // 3. Log to Neon DB
        const client = new Client({ connectionString: DATABASE_URL });
        await client.connect();
        try {
            await client.query(
                `INSERT INTO search_logs (
          query_text, 
          search_results_json, 
          gemini_response_raw, 
          gemini_inferred_json, 
          singer_name, 
          song_title, 
          creators, 
          confidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    q,
                    JSON.stringify(serperResponse.data),
                    responseText,
                    JSON.stringify(singer_metadata),
                    singer_metadata.singer_name || 'Unknown',
                    singer_metadata.song_title || 'Unknown',
                    JSON.stringify(singer_metadata.creators || []),
                    singer_metadata.confidence || 'low'
                ]
            );
        } catch (dbErr) {
            console.error('Database logging failed:', dbErr);
        } finally {
            await client.end();
        }

        return Response.json({
            query: q,
            youtube_results,
            singer_metadata
        });

    } catch (error) {
        console.error('Search API error:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
