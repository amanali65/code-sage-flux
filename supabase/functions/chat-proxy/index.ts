import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to chat-proxy');
    
    const { message } = await req.json();
    console.log('Message received:', message);

    // Call the n8n webhook
    const n8nResponse = await fetch('https://claud.share.zrok.io/webhook/chatbot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    console.log('n8n webhook response status:', n8nResponse.status);
    
    if (!n8nResponse.ok) {
      throw new Error(`n8n webhook returned status ${n8nResponse.status}`);
    }

    const responseData = await n8nResponse.json();
    console.log('n8n response data:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Failed to communicate with the chatbot backend'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
