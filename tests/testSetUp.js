"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/database");
beforeAll(async () => {
    console.log('Running bofore all');
    console.log = () => { };
    await (0, database_1.initDb)(); // 
});
afterAll(async () => {
    console.log = console.log;
    await (0, database_1.closeDb)();
});
