# LeadFlow CRM – MongoDB Migration Collection Mapping

## 1. crm_leads

| Collection | Source JSON file | Expected documents |
|---|---|---:|
| leads | crm_leads_leads.json | 50 |
| lead_sources | crm_leads_lead_sources.json | 5 |
| scoring_rules | crm_leads_scoring_rules.json | 3 |

**Total: 58 documents**

## 2. crm_activity

| Collection | Source JSON file | Expected documents |
|---|---|---:|
| tasks | crm_activity_tasks.json | 10 |
| meetings | crm_activity_meetings.json | 10 |
| notes | crm_activity_notes.json | 10 |
| activities | crm_activity_activities.json | 10 |

**Total: 40 documents**

## 3. crm_support

| Collection | Source JSON file | Expected documents |
|---|---|---:|
| sla_rules | crm_support_sla_rules.json | 3 |
| tickets | crm_support_tickets.json | 20 |

**Total: 23 documents**

## 4. crm_notify

| Collection | Source JSON file | Expected documents |
|---|---|---:|
| notifications | crm_notify_notifications.json | 10 |
| preferences | crm_notify_preferences.json | 5 |

**Total: 15 documents**

## 5. Migration Summary

| Item | Count |
|---|---:|
| Databases | 4 |
| Collections | 11 |
| Expected documents | 136 |
| Validated JSON exports | 11 |

## 6. Migration Notes

- Source: Existing local Windows MongoDB installation.
- Target: Docker MongoDB 8.0.
- Preserve existing document `_id` values.
- Import each JSON file into its corresponding database and collection.
- Recreate required indexes after importing the documents.
- Create a non-unique index on `crm_leads.leads.email` for faster email searches.
- The Leads service must check for duplicate leads using email and phone before creating a new lead.
- Configure separate application users with `readWrite` permissions on their respective databases.
- Do not delete or overwrite existing local databases or Docker volumes.
- Verify document counts and indexes after migration.

**Note:** Document counts are expected counts from the local export validation. Final counts must be verified in Docker after migration.