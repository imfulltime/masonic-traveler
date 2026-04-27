import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Check if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase not configured');
    return NextResponse.redirect(new URL('/auth/login?error=config_error', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url));
  }

  try {
    await supabase.auth.exchangeCodeForSession(code);
  } catch (error) {
    console.error('Error exchanging code for session:', error);
    return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url));
  }

  // Redirect to dashboard on successful auth
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
