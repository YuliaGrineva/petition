const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

const bcrypt = require("bcryptjs");

module.exports.getAllSignatures = () => db.query("SELECT * FROM signatures");

module.exports.getAllSignersProfiles = () =>
    db.query(
        "SELECT users.firstname AS firstname, users.lastname AS lastname, city, age, url FROM users RIGHT JOIN signatures ON users.id = signatures.user_id FULL OUTER JOIN profiles ON users.id = profiles.user_id"
    );
module.exports.getCitySigners = ({ city }) => {
    const query = `SELECT * FROM users
JOIN signatures
ON users.id = signatures.user_id
JOIN profiles
ON users.id = profiles.user_id
WHERE LOWER(profiles.city) = LOWER($1)`;

    const params = [city];
    return db.query(query, params);
};

module.exports.addSigns = (firstname, lastname, signature, user_id) => {
    const query = `
        INSERT INTO signatures (firstname, lastname, signature, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const params = [firstname, lastname, signature, user_id];
    return db.query(query, params);
    // req.session.signatureId = id;
};

function hashPassword(password) {
    return bcrypt.genSalt().then((salt) => {
        return bcrypt.hash(password, salt);
    });
}

// module.exports.getUserById = (id) => {

// };

module.exports.addUser = ({ firstname, lastname, email, password }) => {
    return hashPassword(password).then((password_hash) => {
        const query = `
       INSERT INTO users (firstname, lastname, email, password_hash)
       VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
        const params = [firstname, lastname, email, password_hash];
        return db.query(query, params);
    });
};

function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1`;
    const params = [email];
    const foundUser = db.query(query, params);
    return foundUser;
}

module.exports.checkLogin = ({ email, password }) => {
    return getUserByEmail(email).then((result) => {
        const foundUser = result.rows[0];
        console.log("HERE", foundUser);
        if (!foundUser) {
            return null;
        }
        return bcrypt
            .compare(password, foundUser.password_hash)
            .then(function (match) {
                if (match) {
                    return foundUser;
                } else {
                    return null;
                }
            });
    });
};

// WHERE LOWER(profiles.city) = LOWER($1);
