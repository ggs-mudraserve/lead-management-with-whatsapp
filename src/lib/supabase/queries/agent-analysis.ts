import { supabase } from '@/lib/supabase/client';
import { AgentAnalysisData, AgentAnalysisFilters, AgentAnalysisSummary } from '@/lib/supabase/database.types';

export async function getAgentAnalysisData(
  filters: AgentAnalysisFilters = {}
): Promise<AgentAnalysisData[]> {
  const { startMonth, endMonth, segment, agentId } = filters;

  try {
    const { data, error } = await supabase.rpc('get_agent_analysis_data', {
      start_month: startMonth || null,
      end_month: endMonth || null,
      segment_filter: segment || null,
      agent_filter: agentId || null
    });

    if (error) {
      console.error('Error fetching agent analysis data:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch agent analysis data:', err);
    throw err;
  }
}

export function calculateAgentAnalysisSummary(data: AgentAnalysisData[]): AgentAnalysisSummary {
  if (!data || data.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      totalProfitLoss: 0,
      totalAgents: 0,
      profitableAgents: 0,
      lossAgents: 0,
      avgProfitMargin: 0
    };
  }

  const totalRevenue = data.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
  const totalCost = data.reduce((sum, item) => sum + (item.total_cost || 0), 0);
  const totalProfitLoss = data.reduce((sum, item) => sum + (item.profit_loss || 0), 0);
  
  const uniqueAgents = new Set(data.map(item => item.agent_id));
  const totalAgents = uniqueAgents.size;
  
  const agentProfits = new Map<string, number>();
  data.forEach(item => {
    const currentProfit = agentProfits.get(item.agent_id) || 0;
    agentProfits.set(item.agent_id, currentProfit + (item.profit_loss || 0));
  });
  
  const profitableAgents = Array.from(agentProfits.values()).filter(profit => profit > 0).length;
  const lossAgents = Array.from(agentProfits.values()).filter(profit => profit < 0).length;
  
  const avgProfitMargin = totalRevenue > 0 ? (totalProfitLoss / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCost,
    totalProfitLoss,
    totalAgents,
    profitableAgents,
    lossAgents,
    avgProfitMargin
  };
}

export interface SegmentAnalysisData {
  segment: string;
  totalRevenue: number;
  totalCost: number;
  profitLoss: number;
  profitMargin: number;
  agentCount: number;
  caseCount: number;
}

export function calculateSegmentAnalysis(data: AgentAnalysisData[]): SegmentAnalysisData[] {
  if (!data || data.length === 0) return [];

  const segmentMap = new Map<string, {
    revenue: number;
    cost: number;
    agents: Set<string>;
    cases: number;
  }>();

  data.forEach(item => {
    const segment = item.segment;
    const current = segmentMap.get(segment) || {
      revenue: 0,
      cost: 0,
      agents: new Set(),
      cases: 0
    };

    current.revenue += item.total_revenue || 0;
    current.cost += item.total_cost || 0;
    current.agents.add(item.agent_id);
    current.cases += item.case_count || 0;

    segmentMap.set(segment, current);
  });

  return Array.from(segmentMap.entries()).map(([segment, data]) => ({
    segment,
    totalRevenue: data.revenue,
    totalCost: data.cost,
    profitLoss: data.revenue - data.cost,
    profitMargin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
    agentCount: data.agents.size,
    caseCount: data.cases
  }));
}

export function getDefaultDateRange() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Start from June 2025, end with current month
  const startMonth = '2025-06';
  const endMonth = currentMonth;
  
  return { startMonth, endMonth };
}