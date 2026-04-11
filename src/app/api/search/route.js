import { Client } from 'pg';
import axios from 'axios';

async function fetchItunesMetadata(q) {
    try {
        const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`);
        if (response.data.results && response.data.results.length > 0) {
            const track = response.data.results[0];
            return {
                singer_name: track.artistName,
                song_title: track.trackName,
                movie: track.collectionName || 'Unknown Movie',
                year: track.releaseDate ? new Date(track.releaseDate).getFullYear().toString() : 'Unknown',
                genre: track.primaryGenreName || 'Indian',
                era: track.releaseDate ? getEra(new Date(track.releaseDate).getFullYear()) : 'Unknown',
                creators: [
                    { name: track.artistName, role: "Singer" }
                ],
                bio: `A popular track by ${track.artistName} from the album/movie ${track.collectionName || 'Unknown'}.`,
                confidence: "high"
            };
        }
    } catch (e) {
        console.error('iTunes API error:', e);
    }
    return null;
}

function getEra(year) {
    if (year >= 1980 && year < 1990) return "80s";
    if (year >= 1990 && year < 2000) return "90s";
    if (year >= 2000 && year < 2010) return "2000s";
    if (year >= 2010 && year < 2020) return "2010s";
    if (year >= 2020) return "2020s";
    return "Unknown";
}

function parseYoutubeTitle(title) {
    // Simple regex to extract song and movie/singer from common Bollywood title patterns
    // Example: "Song Title | Movie Name | Singer" or "Song Title - Movie"
    const parts = title.split(/[|\-]/).map(p => p.trim());
    return {
        song_title: parts[0] || title,
        movie: parts[1] || 'Unknown Movie',
        singer_name: parts[2] || 'Unknown Singer',
        year: 'Unknown',
        genre: 'Bollywood',
        era: 'Unknown',
        creators: parts[2] ? [{ name: parts[2], role: "Singer" }] : [],
        bio: `Details extracted from search result: ${title}`,
        confidence: "medium"
    };
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q) {
        return Response.json({ error: 'Missing query parameter q' }, { status: 400 });
    }

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

        // 2. Metadata Extraction (Replacing Gemini)
        let singer_metadata = await fetchItunesMetadata(q);

        if (!singer_metadata && youtube_results.length > 0) {
            // Fallback: Parse from the first YouTube title
            singer_metadata = parseYoutubeTitle(youtube_results[0].title);
        }

        if (!singer_metadata) {
            singer_metadata = {
                singer_name: "Unknown",
                song_title: q,
                movie: "Unknown",
                year: "Unknown",
                genre: "Unknown",
                era: "Unknown",
                creators: [],
                bio: "Could not find specific metadata for this query.",
                confidence: "low"
            };
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
                    'NO_LLM_USED', // Mock raw response
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

