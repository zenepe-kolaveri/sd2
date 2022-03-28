// Get the functions in the db.js 
const db = require('../services/db');
const { Programme } = require('./programme');
class Programme {
    // Programme ID
    id;
    // Programme name
    pName;
    constructor(id) {
        this.id = id;
    }
    async getProgrammeName() {
        if (typeof this.name !== 'string') {
            var sql = "SELECT * from Programmes where id = ?"
            const results = await db.query(sql, [this.id]);
            this.pName = results[0].name;
        }
    }
}
async function getAllProgrammes() {
    var sql = "SELECT * from Programmes"
    const results = await db.query(sql);
    var rows = [];
    for (var row of results) {
        // Use our Programme class to neatly format the object going to the template
        rows.push(new Programme(row.id, row.name));
    }
    return rows;
}

module.exports = {
    Programme,
    getAllProgrammes,
}