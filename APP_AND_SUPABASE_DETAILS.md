# Application and Supabase Details

## Application Overview

This is a [Next.js](https://nextjs.org/) application that serves as an internal tool for managing leads and bank applications. It uses [Material-UI (MUI)](https://mui.com/) for its user interface components, providing a consistent and modern look and feel. For data fetching and state management, the application leverages a combination of [React Query](https://tanstack.com/query/v4) for server-state management and the [React Context API](https://reactjs.org/docs/context.html) for global state management.

Authentication is handled by [Supabase Auth](https://supabase.com/docs/guides/auth), which provides a secure and scalable solution for user management.

## Supabase Overview

The backend of this application is powered by Supabase, which provides a suite of tools including a Postgres database, authentication, and serverless functions.

*   **Project ID:** `vxcdvuekhfdkccjhbrhz`

### Supabase Tables

The following is a list of tables in the Supabase database, along with a brief description of their purpose:

| Table Name                      | Description                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `app_notes`                     | Stores notes associated with bank applications.                                                         |
| `application_error_logs`        | Logs any errors that occur within the application for debugging and monitoring.                         |
| `bank`                          | A list of all the banks that the application interacts with.                                            |
| `bank_application`              | Stores all the details of the bank applications, including the applied amount, approved amount, and status. |
| `bulk_send_details`             | Stores the details of bulk messages sent to leads, including the status and any failure reasons.        |
| `bulk_sends`                    | Stores information about bulk message campaigns, including the campaign name, template, and status.       |
| `business_whatsapp_numbers`     | Stores the WhatsApp numbers used for business communication with leads.                                 |
| `conversation_assignment_audit` | Logs the assignment of conversations to different agents for tracking and auditing purposes.            |
| `conversation_status_audit`     | Logs the status changes of conversations, such as when a conversation is opened, closed, or resolved.   |
| `conversations`                 | Stores all the conversations with leads, including the messages and the current status.                 |
| `internal_notes`                | Stores internal notes for conversations that are only visible to the agents.                            |
| `lead_documents`                | Stores all the documents related to a lead, such as their ID, address proof, and income statements.     |
| `lead_missed_reasons`           | Stores the reasons why a lead was missed, which can be used for analysis and improvement.               |
| `lead_notes`                    | Stores notes associated with leads, which can be used to track the progress of a lead.                  |
| `leads`                         | Stores all the information about the leads, including their personal details, contact information, and status. |
| `message_notifications`         | Stores notifications for new messages, which can be used to alert agents.                               |
| `message_queue`                 | A queue for messages that are to be sent, which ensures that messages are sent in a reliable and orderly manner. |
| `message_templates_cache`       | Caches message templates from WhatsApp to improve performance and reduce API calls.                     |
| `messages`                      | Stores all the messages from conversations, including the sender, receiver, and content.                |
| `messages_y2025m05`             | Partitioned table for messages from May 2025.                                                           |
| `messages_y2025m06`             | Partitioned table for messages from June 2025.                                                          |
| `messages_y2025m07`             | Partitioned table for messages from July 2025.                                                          |
| `messages_y2025m08`             | Partitioned table for messages from August 2025.                                                        |
| `missed_opportunity`            | Stores the reasons for missed opportunities, which can be used for analysis and improvement.            |
| `profile`                       | Stores the profiles of all the users, including their name, email, and role.                            |
| `team`                          | Stores the teams of users, which can be used to group users and assign them to specific tasks.          |
| `team_members`                  | Stores the members of each team, which can be used to manage the teams and their members.               |

### Supabase Views

The following is a list of views in the Supabase database, along with a brief description of their purpose:

| View Name                        | Description                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `conversation_with_lead_owner`   | A view that joins the `conversations` table with the `leads` and `profile` tables to provide a complete view of the conversation, including the lead owner's information. |
| `v_all_applications`             | A view that shows all the bank applications, along with the lead and owner information.                 |
| `v_disbursed_applications`       | A view that shows all the disbursed bank applications, along with the lead and owner information.       |

### Supabase Functions

The following is a list of functions in the Supabase database, along with a brief description of their purpose:

| Function Name                            | Description                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `acquire_rr_lock`                        | Acquires a round-robin lock to ensure that only one agent is working on a lead at a time.               |
| `assign_conversation_and_update_related` | Assigns a conversation to an agent and updates the related information in the database.                 |
| `auth_test`                              | A test function for authentication to ensure that the authentication is working correctly.              |
| `can_agent_insert_into_conversation`     | Checks if an agent can insert a message into a conversation.                                            |
| `can_agent_update_conversation_status`   | Checks if an agent can update the status of a conversation.                                             |
| `can_user_access_bank_application`       | Checks if a user can access a bank application.                                                         |
| `can_user_access_lead`                   | Checks if a user can access a lead.                                                                     |
| `check_lead_status_by_mobile`            | Checks the status of a lead by their mobile number.                                                     |
| `close_idle_conversations`               | Closes idle conversations that have been inactive for a certain period of time.                         |
| `converttoe164`                          | Converts a local phone number to the E.164 format.                                                      |
| `converttolocalformat`                   | Converts a phone number to the local format.                                                            |
| `get_all_filtered_applications`          | Gets all the bank applications based on the provided filters.                                           |
| `get_custom_performance_report`          | Gets a custom performance report for the agents and teams.                                              |
| `get_filtered_disbursed_applications`    | Gets all the disbursed bank applications based on the provided filters.                                 |
| `get_or_create_conversation_for_contact` | Gets or creates a conversation for a contact.                                                           |
| `get_recent_bulk_campaigns_with_stats`   | Gets the recent bulk campaigns with their statistics.                                                   |
| `get_user_role`                          | Gets the role of a user.                                                                                |
| `handle_document_upload`                 | Handles the upload of a document and stores it in the database.                                         |
| `handle_whatsapp_message`                | Handles a WhatsApp message and stores it in the database.                                               |
| `initiate_bulk_send_campaign`            | Initiates a bulk send campaign to send messages to a large number of leads.                             |
| `insert_agent_message`                   | Inserts a message from an agent into a conversation.                                                    |
| `insert_bank_application`                | Inserts a bank application into the database.                                                           |
| `insert_message`                         | Inserts a message into a conversation.                                                                  |
| `internal_find_or_create_lead_for_whatsapp` | Finds or creates a lead for a WhatsApp contact.                                                         |
| `is_owner_in_requesting_user_team`       | Checks if the owner of a lead is in the requesting user's team.                                         |
| `manage_message_partitions`              | Manages the message partitions to ensure that the messages are stored in an organized manner.           |
| `select_now_utc`                         | Returns the current UTC time.                                                                           |
