import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function extractYouTubeId(url: string): string | null {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/manage\/videos\/(\d+)/,
    /vimeo\.com\/channels\/[\w-]+\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match?.[1] ? parseInt(match[1]) : 0);
  const minutes = (match?.[2] ? parseInt(match[2]) : 0);
  const seconds = (match?.[3] ? parseInt(match[3]) : 0);
  return hours * 3600 + minutes * 60 + seconds;
}

async function getYouTubeInfo(videoId: string) {
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) {
    return {
      error: 'YouTube API key not configured',
      duration: null
    };
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails,snippet&key=${YOUTUBE_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const video = data.items[0];
  const duration = parseYouTubeDuration(video.contentDetails.duration);
  const thumbnail = video.snippet.thumbnails.maxres?.url ||
                    video.snippet.thumbnails.high?.url ||
                    video.snippet.thumbnails.default?.url;
  const title = video.snippet.title;

  return {
    duration,
    thumbnail,
    title,
    videoId,
    platform: 'youtube'
  };
}

async function getVimeoInfo(videoId: string) {
  const response = await fetch(
    `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
  );

  if (!response.ok) {
    throw new Error(`Vimeo API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    duration: data.duration || null,
    thumbnail: data.thumbnail_url || null,
    title: data.title || null,
    videoId,
    platform: 'vimeo'
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error('URL is required');
    }

    let result;

    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
      result = await getYouTubeInfo(youtubeId);
    } else {
      const vimeoId = extractVimeoId(url);
      if (vimeoId) {
        result = await getVimeoInfo(vimeoId);
      } else {
        throw new Error('Unsupported video platform. Only YouTube and Vimeo are supported.');
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        duration: null
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
