import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyComparisonData } from '@/lib/supabase/queries/monthly-comparison';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const compareDate = searchParams.get('compareDate') || undefined;
    const segments = searchParams.get('segments')?.split(',').filter(Boolean) || undefined;
    const teamIds = searchParams.get('teamIds')?.split(',').filter(Boolean) || undefined;

    const data = await getMonthlyComparisonData({
      compareDate,
      segments,
      teamIds,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in monthly comparison API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly comparison data' },
      { status: 500 }
    );
  }
}