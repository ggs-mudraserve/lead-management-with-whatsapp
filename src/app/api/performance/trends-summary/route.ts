import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyTrendsSummary } from '@/lib/supabase/queries/monthly-comparison';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const compareDate = searchParams.get('compareDate') || undefined;

    const data = await getMonthlyTrendsSummary({
      compareDate,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in trends summary API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends summary data' },
      { status: 500 }
    );
  }
}