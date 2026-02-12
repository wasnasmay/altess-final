import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('[Playout Media Save] Request received');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabaseKey = serviceRoleKey || anonKey;

    console.log('[Playout Media Save] Environment check:');
    console.log('  - SUPABASE_URL present:', !!supabaseUrl);
    console.log('  - SERVICE_ROLE_KEY present:', !!serviceRoleKey);
    console.log('  - ANON_KEY present:', !!anonKey);
    console.log('  - Using key type:', serviceRoleKey ? 'SERVICE_ROLE (bypasses RLS)' : 'ANON (subject to RLS)');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Playout Media Save] ❌ Missing environment variables');
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration',
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const { mediaData, editingId } = body;

    console.log('[Playout Media Save] Request data:');
    console.log('  - Operation:', editingId ? 'UPDATE' : 'INSERT');
    console.log('  - Media data:', JSON.stringify(mediaData, null, 2));
    console.log('  - Editing ID:', editingId || 'N/A');

    // Validation des données
    if (!mediaData.title) {
      console.error('[Playout Media Save] ❌ Missing required field: title');
      return NextResponse.json({
        success: false,
        error: 'Le titre est requis',
      }, { status: 400 });
    }

    if (!mediaData.media_url) {
      console.error('[Playout Media Save] ❌ Missing required field: media_url');
      return NextResponse.json({
        success: false,
        error: 'L\'URL du média est requise',
      }, { status: 400 });
    }

    if (!mediaData.type) {
      console.error('[Playout Media Save] ❌ Missing required field: type');
      return NextResponse.json({
        success: false,
        error: 'Le type de média est requis',
      }, { status: 400 });
    }

    // Préparer les données pour Supabase
    const durationMsValue = parseInt(String(mediaData.duration_ms || '0'), 10);
    const durationSecondsValue = parseInt(String(mediaData.duration_seconds || '0'), 10);

    let finalDurationSeconds = durationSecondsValue;
    let finalDurationMs = durationMsValue;

    if (durationMsValue > 0 && durationSecondsValue === 0) {
      finalDurationSeconds = Math.round(durationMsValue / 1000);
      console.log('[Playout Media Save] 🔄 Conversion duration_ms → duration_seconds:', durationMsValue, 'ms →', finalDurationSeconds, 's');
    } else if (durationSecondsValue > 0 && durationMsValue === 0) {
      finalDurationMs = durationSecondsValue * 1000;
      console.log('[Playout Media Save] 🔄 Conversion duration_seconds → duration_ms:', durationSecondsValue, 's →', finalDurationMs, 'ms');
    } else if (durationSecondsValue === 0 && durationMsValue === 0) {
      finalDurationSeconds = 180;
      finalDurationMs = 180000;
      console.warn('[Playout Media Save] ⚠️ Aucune durée fournie, fallback à 180 secondes (3 min)');
    }

    const cleanedData = {
      title: mediaData.title,
      type: mediaData.type,
      category: mediaData.category || null,
      description: mediaData.description || null,
      media_url: mediaData.media_url,
      thumbnail_url: mediaData.thumbnail_url || null,
      duration_seconds: finalDurationSeconds,
      duration_ms: finalDurationMs,
      file_size_mb: mediaData.file_size_mb || null,
      tags: mediaData.tags || [],
      is_active: mediaData.is_active !== undefined ? mediaData.is_active : true,
    };

    console.log('[Playout Media Save] Cleaned data:', JSON.stringify(cleanedData, null, 2));

    if (editingId) {
      console.log('[Playout Media Save] Executing UPDATE query...');
      console.log('  - Table: playout_media_library');
      console.log('  - ID:', editingId);

      const { data, error } = await supabase
        .from('playout_media_library')
        .update(cleanedData)
        .eq('id', editingId)
        .select();

      if (error) {
        console.error('[Playout Media Save] ❌ UPDATE failed');
        console.error('  - Error message:', error.message);
        console.error('  - Error code:', error.code);
        console.error('  - Error details:', error.details);
        console.error('  - Error hint:', error.hint);
        console.error('  - Full error object:', JSON.stringify(error, null, 2));

        return NextResponse.json({
          success: false,
          error: error.message,
          details: {
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        }, { status: 400 });
      }

      console.log('[Playout Media Save] ✅ UPDATE successful');
      console.log('  - Updated data:', JSON.stringify(data, null, 2));
      console.log('═══════════════════════════════════════════════════════');

      return NextResponse.json({
        success: true,
        message: 'Média mis à jour avec succès',
        data: data?.[0] || null,
      });

    } else {
      console.log('[Playout Media Save] Executing INSERT query...');
      console.log('  - Table: playout_media_library');

      const { data, error } = await supabase
        .from('playout_media_library')
        .insert([cleanedData])
        .select();

      if (error) {
        console.error('[Playout Media Save] ❌ INSERT failed');
        console.error('  - Error message:', error.message);
        console.error('  - Error code:', error.code);
        console.error('  - Error details:', error.details);
        console.error('  - Error hint:', error.hint);
        console.error('  - Full error object:', JSON.stringify(error, null, 2));

        return NextResponse.json({
          success: false,
          error: error.message,
          details: {
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        }, { status: 400 });
      }

      console.log('[Playout Media Save] ✅ INSERT successful');
      console.log('  - Inserted data:', JSON.stringify(data, null, 2));
      console.log('═══════════════════════════════════════════════════════');

      return NextResponse.json({
        success: true,
        message: 'Média ajouté avec succès',
        data: data?.[0] || null,
      });
    }

  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('[Playout Media Save] ❌ FATAL ERROR');
    console.error('Error type:', error.constructor?.name || typeof error);
    console.error('Error message:', error.message || error);
    console.error('Error stack:', error.stack || 'N/A');
    console.error('═══════════════════════════════════════════════════════');

    return NextResponse.json({
      success: false,
      error: 'Erreur serveur interne',
      details: error.message || 'Erreur inconnue',
    }, { status: 500 });
  }
}
