# Supabase Database Schema

## Tables
- profile
- team
- bank
- team_members
- leads
- bank_application
- lead_documents
- lead_missed_reasons
- missed_opportunity
- app_notes
- lead_notes
- n8n_chat

## Views
- v_all_applications
- v_disbursed_applications

## Functions
- check_lead_status_by_mobile
- get_all_filtered_applications
- get_filtered_disbursed_applications
- update_lead_created_at
- handle_lead_update_assign_owner
- get_custom_performance_report
- get_user_role
- handle_document_upload
- is_owner_in_requesting_user_team
- can_user_access_lead
- can_user_access_bank_application
- insert_bank_application
- update_bank_application
- handle_new_user
- handle_lead_insert_assign_owner

## Triggers
- trigger_handle_lead_update_assign_owner
- trigger_update_lead_created_at
- trigger_handle_lead_insert_assign_owner

## Cron Jobs
- remove_stale_owners_daily

## RLS Policies

### missed_opportunity
- Allow admin modify access
- Allow select for all authenticated users

### team
- Allow admin modify access
- Allow select for all authenticated users

### bank
- Allow admin modify access
- Allow select for all authenticated users

### team_members
- Allow admin modify access
- Allow select for all authenticated users

### leads
- Admin delete access
- Allow lead insert for authorized roles
- Allow select if admin or user can access lead
- Allow update if user can access lead

### bank_application
- Admin delete access
- Allow select if user can access bank app
- Block direct inserts
- Block direct updates

### lead_documents
- Allow admin to delete
- Allow insert if user can access lead
- Allow select if user can access lead

### lead_missed_reasons
- Allow delete if user can access lead
- Allow insert if user can access lead
- Allow select if user can access lead

### app_notes
- Allow admin delete if user can access bank app
- Allow insert if user can access bank app
- Allow select if user can access bank app
- Block updates

### lead_notes
- Allow admin delete if user can access lead
- Allow insert if user can access lead
- Allow select if user can access lead
- Block updates

### n8n_chat
- all access allowed

## Storage Buckets
- lead-documents
- whatsapp

## Storage Policies
- Allow admins to delete documents - lead-documents
- Allow authenticated users to delete
- Allow authenticated users to insert
- Allow authenticated users to select
- Allow authenticated users to update
- Allow download if user can access lead - lead-documents
- Allow public read access
- Allow users to read accessible documents - lead-documents
- Allow users to upload documents for accessible leads - lead-doc
- Block direct updates