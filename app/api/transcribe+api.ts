import logger from '@/utils/logger';

export async function POST(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ 
          error: 'API key not configured',
          details: 'Please add your OpenAI API key to the .env file'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('file') as File;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    logger.log('Processing audio file:', audioFile.name, audioFile.size, 'bytes');

    // Prepare FormData for OpenAI
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'verbose_json');
    whisperFormData.append('temperature', '0');

    logger.log('📡 Calling OpenAI Whisper API...');

    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      logger.error('OpenAI API error:', openaiResponse.status, errorData);
      
      let userFriendlyMessage = 'Transcription service temporarily unavailable';
      
      if (openaiResponse.status === 429) {
        userFriendlyMessage = 'API rate limit exceeded. Please try again later';
      } else if (openaiResponse.status === 401) {
        userFriendlyMessage = 'Invalid API key - please check your OpenAI API key';
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Transcription failed',
          details: userFriendlyMessage
        }),
        {
          status: openaiResponse.status,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const transcriptionData = await openaiResponse.json();
    
    logger.log('📥 Raw OpenAI response:', JSON.stringify(transcriptionData, null, 2));
    
    // Validate response
    if (!transcriptionData.text || typeof transcriptionData.text !== 'string') {
      logger.error('❌ No valid text in response');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid transcription',
          details: 'No text content received from API'
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check for prompt injection
    if (transcriptionData.text.includes('Include all spoken content') ||
        transcriptionData.text.includes('Transcribe the complete audio')) {
      logger.error('❌ Prompt injection detected');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid transcription',
          details: 'Received prompt text instead of speech content'
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate minimum content
    if (transcriptionData.text.length < 5) {
      logger.error('❌ Transcript too short');
      return new Response(
        JSON.stringify({ 
          error: 'Empty transcription',
          details: 'The audio file produced no transcribable content'
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    logger.log('✅ Valid transcription received:', {
      textLength: transcriptionData.text.length,
      segmentCount: transcriptionData.segments?.length || 0,
      language: transcriptionData.language,
      duration: transcriptionData.duration
    });

    return new Response(
      JSON.stringify({
        text: transcriptionData.text,
        segments: transcriptionData.segments || [],
        duration: transcriptionData.duration,
        language: transcriptionData.language,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error) {
    logger.error('❌ Transcription error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
}