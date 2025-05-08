import { createAdminClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test Supabase connection
    const supabase = createAdminClient();
    const { error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    return NextResponse.json({
      status: 'healthy',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      services: {
        supabase: 'connected',
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 