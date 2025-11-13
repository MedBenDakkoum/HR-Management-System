#!/usr/bin/env node

/**
 * Add Hire Dates to Existing Employees
 * 
 * This script adds hireDate field to all employees that don't have one.
 * Uses createdAt timestamp if available, otherwise uses current timestamp.
 * 
 * Usage:
 *   node scripts/add-hire-dates.js
 */

require('dotenv').config();
const { db, collections, admin } = require("../config/firebase");

async function addHireDates() {
  try {
    console.log('\n📅 Adding Hire Dates to Existing Employees\n');
    console.log('=====================================\n');

    // Get all employees
    const employeesSnapshot = await db()
      .collection(collections.EMPLOYEES)
      .get();

    console.log(`Found ${employeesSnapshot.size} employees\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of employeesSnapshot.docs) {
      const data = doc.data();
      
      if (!data.hireDate) {
        // Set hireDate to createdAt if available, or current timestamp
        const hireDate = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
        
        await db()
          .collection(collections.EMPLOYEES)
          .doc(doc.id)
          .update({
            hireDate: hireDate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        
        console.log(`✓ Updated: ${data.name} (${data.email})`);
        updatedCount++;
      } else {
        console.log(`⊘ Skipped: ${data.name} (already has hireDate)`);
        skippedCount++;
      }
    }

    console.log('\n=====================================');
    console.log('Migration Complete!');
    console.log('=====================================');
    console.log(`Updated: ${updatedCount} employees`);
    console.log(`Skipped: ${skippedCount} employees`);
    console.log(`Total:   ${employeesSnapshot.size} employees\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error adding hire dates:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
addHireDates().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

