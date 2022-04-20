const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.getAllSignatures = () => db.query("SELECT * FROM signatures");

module.exports.addSigns = (firstname, lastname, signature) => {
    const query = `
        INSERT INTO signatures (firstname, lastname, signature)
        VALUES ($1, $2, $3)
        RETURNING *
    `;
    const params = [firstname, lastname, signature];
    return db.query(query, params);
};
