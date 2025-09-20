#!/usr/bin/env tsx

/**
 * Database Migration Helper
 * Prints SQL migrations for manual execution in Supabase SQL Editor
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const migrations = [
  '001_create_live_data_tables.sql',
  '002_add_sync_status_function.sql',
  '003_create_park_schedules_table.sql',
  '004_create_park_crowd_predictions_table.sql',
  '005_create_activity_ratings_table.sql',
  '006_update_activity_type_constraint.sql',
  '007_create_live_park_events_table.sql'
];

function printMigrations(): void {
  console.log('📋 Database Migrations for Supabase SQL Editor');
  console.log('='.repeat(60));
  console.log('Copy and paste each migration into the Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/zclzhvkoqwelhfxahaly/sql/new');
  console.log('');

  migrations.forEach((filename, index) => {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`📄 MIGRATION ${index + 1}: ${filename}`);
    console.log(`${'='.repeat(40)}\n`);

    try {
      const migrationPath = join(__dirname, '..', 'packages', 'shared', 'src', 'database', 'migrations', filename);
      const sql = readFileSync(migrationPath, 'utf-8');
      console.log(sql);
    } catch (error) {
      console.error(`❌ Failed to read migration: ${filename}`);
      console.error(error);
    }

    console.log(`\n${'='.repeat(40)}`);
    console.log(`📄 END MIGRATION ${index + 1}`);
    console.log(`${'='.repeat(40)}\n`);
  });

  console.log('🔥 After running these migrations, tables should be created:');
  console.log('  - live_parks');
  console.log('  - live_attractions');
  console.log('  - live_entertainment');
  console.log('  - live_sync_status');
  console.log('  - live_park_schedules');
  console.log('  - park_crowd_predictions');
  console.log('  - activity_ratings');
  console.log('  - live_park_events');
  console.log('  - update_sync_status() function');
}

// Run if called directly
if (require.main === module) {
  printMigrations();
}

export { printMigrations };