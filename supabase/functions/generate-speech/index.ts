import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, speaker, volume, speed, language, type_media, botnoiToken } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }
    if (!botnoiToken) {
      throw new Error('Botnoi token is required')
    }

    // Call the Botnoi API
    const response = await fetch('https://api-voice.botnoi.ai/openapi/v1/generate_audio', {
      method: 'POST',
      headers: {
        'Botnoi-Token': botnoiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        speaker: speaker || '1',
        volume: volume || '1',
        speed: speed || 1,
        type_media: type_media || 'mp3',
        save_file: 'true',
        language: language || 'th'
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Botnoi API error: ${error}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in generate-speech function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
