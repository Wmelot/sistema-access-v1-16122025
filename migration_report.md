# Migration Report: Legacy Data Import

## Overview
Successfully migrated legacy data (`profiles`, `services`, `appointments`) into the current development environment.
The process handled ID collisions, schema mismatches, and missing dependencies to ensure a stable state.

## 📊 Migration Summary
- **Profiles**: 5 (2 Existing + 2 New + 1 System)
- **Services**: 8 (Synced with legacy IDs)
- **Appointments**: 191 (Fully imported)

## 🛠️ Actions Taken

### 1. Schema Updates
Added missing columns to match the legacy data structure:
- **Profiles**: `online_booking_enabled`, `slot_interval`, `has_agenda`, `address_*`, `bio`, etc.
- **Appointments**: `is_extra`, `organization_id`, `invoice_id`, `type`, `status` mapping.

### 2. ID Mapping & User Creation
Legacy IDs were mapped to local IDs where possible to preserve data integrity.
- **Rayane Vilela Pereira**: Created new Auth User.
- **Fábio de Oliveira Cardoso**: Created new Auth User.
- **Warley de Melo Oliveira**: Mapped to existing local user.
- **Felipe França Perdigão**: Mapped to existing local user.

> **Note**: New users were created with generic emails (e.g., `rayane...migration.axiom.local`) and password `ChangeMe123!`. You can update these in the Supabase Dashboard.

### 3. Patient Resolution
The legacy dump **did not check patients**. To prevent Reference Errors (FK violations) for the 191 appointments, **Placeholder Patients** were created for each unique Patient ID in the dump.
- **Name**: `Legacy Patient from Dump`
- **Action Required**: You may need to update these patient records with real data or import a `patients` dump if available.

### 4. Status Mapping
Legacy appointment statuses were mapped to the current system's enum:
- `'attended'` → `'completed'`
- `'cancelled'` (legacy typo) → `'canceled'`
- `'checked_in'` → `'confirmed'`

### 5. Missing Data Handling
- **Locations & Invoices**: The dump did not include these tables. References in `appointments` were set to `NULL` to allow import.
- **Schedules**: The `professional_availability` table exists but is **EMPTY**. Professionals will not have open slots until you configure their availability in the dashboard or import availability data.

## 🗄️ Storage Bucket Audit
Verified the storage buckets in the current environment:
| Bucket Name | Status |
|-------------|--------|
| `avatars` | ✅ Exists |
| `attachments` | ✅ Exists |
| `patient-files` | ❌ Missing |
| `logos` | ❌ Missing |
| `documents` | ❌ Missing |

> **Recommendation**: Ensure the missing buckets are created if the application logic relies on them.

## ✅ Next Steps
1. **Verify Data**: Log in and check `Dashboard > Professionals` and `Calendar` to see the migrated data.
2. **Configure Availability**: Set up work hours for the professionals to enable booking.
3. **Update Patients**: If you have patient data, consider importing it to overwrite the placeholders.
