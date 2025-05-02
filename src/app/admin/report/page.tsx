'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
// MUI Imports
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

import {
    getActiveLeadOwners,
    getTeams,
    UserOption,
    TeamOption,
    segmentOptions // Assuming segmentOptions = ['PL', 'BL'] is exported
} from '@/lib/supabase/queries/filters'; // Adjust path if needed

// Interface for the data returned by the Supabase function
interface ReportRow {
    segment: string;
    lead_owner_id: string;
    lead_owner_name: string;
    team_id: string | null;
    team_name: string | null;
    app_login_count: number;
    total_disbursed_amount: number;
}

// Interface for filter state - dates are now strings 'YYYY-MM-DD' or empty/null
interface ReportFilters {
    segments: string[];
    ownerIds: string[];
    teamIds: string[];
    dateStart: string | null;
    dateEnd: string | null;
}

// Helper function to get selected options from a multi-select
const getSelectedOptions = (options: HTMLOptionsCollection): string[] => {
    return Array.from(options)
        .filter(option => option.selected)
        .map(option => option.value);
};

export default function PerformanceReportPageTailwind() {
    const [filters, setFilters] = useState<ReportFilters>({
        segments: [],
        ownerIds: [],
        teamIds: [],
        dateStart: null,
        dateEnd: null,
    });

    // --- Fetch filter options ---
    const { data: ownerOptions, isLoading: isLoadingOwners } = useQuery<UserOption[], Error>({
        queryKey: ['activeLeadOwners'],
        queryFn: getActiveLeadOwners,
    });

    const { data: teamOptions, isLoading: isLoadingTeams } = useQuery<TeamOption[], Error>({
        queryKey: ['teams'],
        queryFn: getTeams,
    });

    // --- Fetch Report Data ---
    const { data: reportData, isLoading: isLoadingReport, isError, error } = useQuery<ReportRow[], Error>({
        queryKey: ['performanceReport', filters], // Using the whole filters object as key
        queryFn: async () => {
            const params = {
                p_segments: filters.segments.length > 0 ? filters.segments : null,
                p_owner_ids: filters.ownerIds.length > 0 ? filters.ownerIds : null,
                p_team_ids: filters.teamIds.length > 0 ? filters.teamIds : null,
                // Pass date strings directly, ensuring empty string becomes null
                p_date_start: filters.dateStart || null,
                p_date_end: filters.dateEnd || null,
            };

            console.log("Calling get_custom_performance_report with:", params);

            const { data, error: rpcError } = await supabase.rpc('get_custom_performance_report', params);

            if (rpcError) {
                console.error('RPC Error fetching performance report:', rpcError);
                throw new Error(rpcError.message || 'Failed to fetch performance report data.');
            }
             if (!data) {
                console.error('No data returned from RPC.');
                return [];
             }
             if (!Array.isArray(data)) {
                 console.error('Unexpected RPC response structure:', data);
                 throw new Error('Invalid response format received from server.');
             }
            return data as ReportRow[];
        },
        enabled: true,
        placeholderData: (previousData) => previousData,
        refetchOnWindowFocus: false,
    });

    // --- Handlers ---
    const handleMultiSelectChange = (
        event: SelectChangeEvent<string[]>,
        field: keyof Pick<ReportFilters, 'segments' | 'ownerIds' | 'teamIds'>
    ) => {
        const { target: { value } } = event;
        const selectedValues = typeof value === 'string' ? value.split(',') : value;

        setFilters(prev => ({
            ...prev,
            [field]: selectedValues,
        }));
    };

    const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>, field: keyof Pick<ReportFilters, 'dateStart' | 'dateEnd'>) => {
         setFilters(prev => ({
             ...prev,
             [field]: event.target.value || null, // Store date as string 'YYYY-MM-DD' or null
         }));
    };

    // --- Render ---
    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-screen-xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Performance Report</h1>

            {/* Filter Section - Improved Styling */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Filters</h2>
                {/* Using CSS Grid for filter layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-4 items-end">
                    {/* Segment Filter - Now MUI Select */}
                    <FormControl>
                        <InputLabel id="segment-filter-label">Segment</InputLabel>
                        <Select
                            labelId="segment-filter-label"
                            id="segment-filter"
                            multiple
                            value={filters.segments}
                            onChange={(e) => handleMultiSelectChange(e, 'segments')}
                            input={<OutlinedInput label="Segment" />}
                            renderValue={(selected) => selected.join(', ')}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        width: 250,
                                    },
                                },
                            }}
                        >
                            {segmentOptions.map((segment) => (
                                <MenuItem key={segment} value={segment}>
                                    <Checkbox checked={filters.segments.indexOf(segment) > -1} />
                                    <ListItemText primary={segment} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Lead Owner Filter */}
                    <FormControl>
                        <InputLabel id="owner-filter-label">Lead Owner</InputLabel>
                        <Select
                            labelId="owner-filter-label"
                            id="owner-filter"
                            multiple
                            value={filters.ownerIds}
                            onChange={(e) => handleMultiSelectChange(e, 'ownerIds')}
                            input={<OutlinedInput label="Lead Owner" />}
                            renderValue={(selected) => {
                                if (selected.length === 0) return '';
                                if (selected.length === 1) return ownerOptions?.find(o => o.id === selected[0])?.name ?? '';
                                return `${selected.length} selected`;
                            }}
                            disabled={isLoadingOwners}
                            MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
                        >
                            {isLoadingOwners && <MenuItem disabled>Loading...</MenuItem>}
                            {ownerOptions?.map((owner) => (
                                <MenuItem key={owner.id} value={owner.id}>
                                    <Checkbox checked={filters.ownerIds.indexOf(owner.id) > -1} />
                                    <ListItemText primary={owner.name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Team Filter */}
                    <FormControl>
                        <InputLabel id="team-filter-label">Team</InputLabel>
                        <Select
                            labelId="team-filter-label"
                            id="team-filter"
                            multiple
                            value={filters.teamIds}
                            onChange={(e) => handleMultiSelectChange(e, 'teamIds')}
                            input={<OutlinedInput label="Team" />}
                            renderValue={(selected) => {
                                if (selected.length === 0) return '';
                                if (selected.length === 1) return teamOptions?.find(t => t.id === selected[0])?.name ?? '';
                                return `${selected.length} selected`;
                            }}
                            disabled={isLoadingTeams}
                            MenuProps={{ PaperProps: { style: { maxHeight: 224, width: 250 } } }}
                        >
                            {isLoadingTeams && <MenuItem disabled>Loading...</MenuItem>}
                            {teamOptions?.map((team) => (
                                <MenuItem key={team.id} value={team.id}>
                                    <Checkbox checked={filters.teamIds.indexOf(team.id) > -1} />
                                    <ListItemText primary={team.name} />
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Date Filters */}
                    <TextField
                        id="date-from"
                        label="Date From"
                        type="date"
                        value={filters.dateStart || ''}
                        onChange={(e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'dateStart')}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <TextField
                        id="date-to"
                        label="Date To"
                        type="date"
                        value={filters.dateEnd || ''}
                        onChange={(e) => handleDateChange(e as React.ChangeEvent<HTMLInputElement>, 'dateEnd')}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </div>
             </div>

            {/* Report Table - Improved Styling */}
            <div className="bg-white shadow-md overflow-hidden rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th scope="col" className="px-8 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Segment</th>
                                <th scope="col" className="px-8 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lead Owner</th>
                                <th scope="col" className="px-8 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                                <th scope="col" className="px-8 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">App Login Count</th>
                                <th scope="col" className="px-8 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Disbursed Amount</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoadingReport ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10">
                                        {/* Improved loading spinner using Tailwind */}
                                        <div role="status" className="inline-block h-8 w-8 text-indigo-600 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
                                            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    {/* Improved error display */}
                                    <td colSpan={5} className="px-8 py-4 text-center text-red-700 bg-red-50">
                                        Error loading report: {error?.message || 'Unknown error'}
                                    </td>
                                </tr>
                            ) : reportData && reportData.length > 0 ? (
                                reportData.map((row, index) => (
                                    // Added subtle hover effect
                                    <tr key={`${row.lead_owner_id}-${row.team_id}-${row.segment}-${index}`} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                        <td className="px-8 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.segment}</td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">{row.lead_owner_name ?? 'Unassigned'}</td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700">{row.team_name ?? 'N/A'}</td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{row.app_login_count}</td>
                                        <td className="px-8 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                                            {/* Consistent currency formatting */}
                                            {row.total_disbursed_amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    {/* Improved no data message */}
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        No data available for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 