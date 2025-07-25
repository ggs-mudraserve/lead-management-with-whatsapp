import { NextRequest, NextResponse } from 'next/server';
import { getSegmentComparisonData } from '@/lib/supabase/queries/monthly-comparison';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const compareDate = searchParams.get('compareDate') || undefined;

    const data = await getSegmentComparisonData({
      compareDate,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in segment comparison API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch segment comparison data' },
      { status: 500 }
    );
  }
}