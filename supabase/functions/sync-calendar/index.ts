import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { eventDate, eventType, clientName, orchestraName, duration = 4 } = await req.json();

    const startDate = new Date(eventDate);
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + duration);

    const calendarEvent = {
      summary: `${eventType} - ${clientName}`,
      description: `Prestation musicale pour ${clientName}\nOrchestre: ${orchestraName}\nType: ${eventType}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'Europe/Paris',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Paris',
      },
      location: 'À confirmer avec le client',
      colorId: '11',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    };

    console.log('Calendar event prepared:');
    console.log(JSON.stringify(calendarEvent, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Événement Google Calendar préparé avec succès',
        event: {
          title: calendarEvent.summary,
          start: calendarEvent.start.dateTime,
          end: calendarEvent.end.dateTime,
          description: calendarEvent.description
        },
        note: 'Pour synchroniser avec Google Calendar, configurez les credentials Google Cloud dans les secrets Supabase'
      }),
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
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
