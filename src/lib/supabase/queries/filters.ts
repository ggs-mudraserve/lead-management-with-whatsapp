import { createBrowserClient } from '@supabase/ssr';

export type UserOption = {
  id: string;
  name: string;
};

export type TeamOption = {
  id: string;
  name: string;
};

// Hardcoded based on ENUMs defined in databasedetails.md
export const segmentOptions: string[] = ['PL', 'BL'];
export const leadStageOptions: string[] = [
  'New',
  'Under Review',
  'Reject Review',
  'Reject',
  'Approved',
  'Disbursed',
  'documents_incomplete',
];

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getActiveLeadOwners(): Promise<UserOption[]> {
  const { data, error } = await supabase
    .from('profile')
    .select('id, first_name, last_name')
    .in('role', ['agent', 'team_leader'])
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching active lead owners:', error);
    throw new Error('Could not fetch lead owners');
  }

  return data.map((user) => ({
    id: user.id,
    name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Unnamed User',
  }));
}

export async function getTeams(): Promise<TeamOption[]> {
  const { data, error } = await supabase
    .from('team')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching teams:', error);
    throw new Error('Could not fetch teams');
  }

  return data;
} 