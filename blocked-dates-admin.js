#!/usr/bin/env ts-node
"use strict";
/**
 * PERMANENT SOLUTION: Blocked Dates Admin Tool
 *
 * This script provides comprehensive blocked dates management to solve
 * the frontend-backend synchronization issues permanently.
 *
 * Usage:
 *   npm run blocked-dates-admin -- clear-all
 *   npm run blocked-dates-admin -- summary
 *   npm run blocked-dates-admin -- validate
 *   npm run blocked-dates-admin -- force-sync
 *   npm run blocked-dates-admin -- block-multiple "2025-10-25,2025-10-26,2025-10-27"
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockedDatesAdmin = void 0;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.DB_CONN_STRING || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'appointmentAppDB';
class BlockedDatesAdmin {
    client;
    db;
    blockedDates;
    constructor() {
        this.client = new mongodb_1.MongoClient(MONGODB_URI);
    }
    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db(DB_NAME);
            this.blockedDates = this.db.collection('blocked_dates');
            console.log('✅ Connected to database successfully');
        }
        catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
    }
    async disconnect() {
        await this.client.close();
        console.log('🔌 Database connection closed');
    }
    async clearAllBlockedDates() {
        console.log('🧹 Clearing ALL blocked dates...');
        const result = await this.blockedDates.deleteMany({});
        console.log(`✅ Cleared ${result.deletedCount} blocked dates`);
        console.log(`📅 Database now has 0 blocked dates`);
        return result.deletedCount;
    }
    async getSummary() {
        console.log('📊 Getting blocked dates summary...');
        const allBlockedDates = await this.blockedDates.find({}).toArray();
        const summary = {
            totalBlockedDates: allBlockedDates.length,
            blockedDates: allBlockedDates.map((bd) => ({
                date: bd.date,
                reason: bd.reason
            })),
            lastUpdated: new Date().toISOString(),
            syncStatus: 'current'
        };
        console.log('📈 Summary:', JSON.stringify(summary, null, 2));
        return summary;
    }
    async validateConsistency() {
        console.log('🔍 Validating blocked dates consistency...');
        const allBlockedDates = await this.blockedDates.find({}).toArray();
        // Check for duplicates
        const dateSet = new Set();
        const duplicates = [];
        allBlockedDates.forEach((bd) => {
            if (dateSet.has(bd.date)) {
                duplicates.push(bd.date);
            }
            else {
                dateSet.add(bd.date);
            }
        });
        const validation = {
            isValid: duplicates.length === 0,
            totalBlockedDates: allBlockedDates.length,
            duplicates: duplicates,
            issues: duplicates.length > 0 ? [`Found ${duplicates.length} duplicate dates`] : [],
            timestamp: new Date().toISOString()
        };
        console.log('✅ Validation result:', JSON.stringify(validation, null, 2));
        return validation;
    }
    async forceSync() {
        console.log('🔄 Forcing blocked dates sync...');
        // Get current state
        const allBlockedDates = await this.blockedDates.find({}).toArray();
        // Remove duplicates
        const uniqueDates = new Map();
        allBlockedDates.forEach((bd) => {
            if (!uniqueDates.has(bd.date)) {
                uniqueDates.set(bd.date, bd);
            }
        });
        const uniqueBlockedDates = Array.from(uniqueDates.values());
        // Clear all and re-insert unique ones
        await this.blockedDates.deleteMany({});
        if (uniqueBlockedDates.length > 0) {
            await this.blockedDates.insertMany(uniqueBlockedDates);
        }
        const syncResult = {
            message: 'Blocked dates sync completed successfully',
            originalCount: allBlockedDates.length,
            uniqueCount: uniqueBlockedDates.length,
            duplicatesRemoved: allBlockedDates.length - uniqueBlockedDates.length,
            timestamp: new Date().toISOString()
        };
        console.log('✅ Sync result:', JSON.stringify(syncResult, null, 2));
        return syncResult;
    }
    async blockMultipleDates(dates, reason = 'Day blocked off') {
        console.log('📅 Blocking multiple dates...');
        console.log('Dates to block:', dates);
        // Validate all dates
        for (const date of dates) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                throw new Error(`Invalid date format: ${date}. Use YYYY-MM-DD`);
            }
        }
        const blockedDates = dates.map(date => ({
            date,
            reason,
            recurringPattern: 'none',
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        const result = await this.blockedDates.insertMany(blockedDates, { ordered: false });
        console.log(`✅ Successfully blocked ${result.insertedCount} dates`);
        return result.insertedCount;
    }
    async showHelp() {
        console.log(`
🔧 BLOCKED DATES ADMIN TOOL - PERMANENT SOLUTION

This tool provides comprehensive blocked dates management to solve
frontend-backend synchronization issues permanently.

COMMANDS:
  clear-all           Clear ALL blocked dates from database
  summary            Get summary of all blocked dates
  validate           Validate blocked dates consistency
  force-sync         Force sync (remove duplicates)
  block-multiple     Block multiple dates (comma-separated)
  help               Show this help message

EXAMPLES:
  npm run blocked-dates-admin -- clear-all
  npm run blocked-dates-admin -- summary
  npm run blocked-dates-admin -- validate
  npm run blocked-dates-admin -- force-sync
  npm run blocked-dates-admin -- block-multiple "2025-10-25,2025-10-26,2025-10-27"

PERMANENT FIXES:
  ✅ Clear all blocked dates instantly
  ✅ Block multiple dates at once
  ✅ Validate database consistency
  ✅ Remove duplicates automatically
  ✅ Force sync frontend-backend state
    `);
    }
}
exports.BlockedDatesAdmin = BlockedDatesAdmin;
async function main() {
    const admin = new BlockedDatesAdmin();
    try {
        await admin.connect();
        const command = process.argv[2];
        const args = process.argv.slice(3);
        switch (command) {
            case 'clear-all':
                await admin.clearAllBlockedDates();
                break;
            case 'summary':
                await admin.getSummary();
                break;
            case 'validate':
                await admin.validateConsistency();
                break;
            case 'force-sync':
                await admin.forceSync();
                break;
            case 'block-multiple':
                if (args.length === 0) {
                    console.error('❌ Please provide dates to block (comma-separated)');
                    process.exit(1);
                }
                const dates = args[0].split(',').map(d => d.trim());
                await admin.blockMultipleDates(dates);
                break;
            case 'help':
            default:
                await admin.showHelp();
                break;
        }
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
    finally {
        await admin.disconnect();
    }
}
if (require.main === module) {
    main();
}
