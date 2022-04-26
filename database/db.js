const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

const bcrypt = require("bcryptjs");

module.exports.getAllSignatures = () => db.query("SELECT * FROM signatures");

module.exports.getAllSignersProfiles = () => {
    const query = `SELECT users.firstname AS firstname, users.lastname AS lastname, city, age, url 
        FROM users 
        JOIN signatures 
        ON users.id = signatures.user_id 
        FULL OUTER JOIN profiles 
     ON users.id = profiles.user_id`;
    const params = [];
    return db.query(query, params);
};

module.exports.prePopulated = (id) => {
    const query = `SELECT users.firstname AS firstname, users.lastname AS lastname, users.email AS email, age, city, url
        FROM users
        RIGHT JOIN profiles
        ON users.id = profiles.user_id
        WHERE users.id = $1`;
    const params = [id];
    return db.query(query, params);
};

module.exports.updateUsersNoPass = (firstname, lastname, email, id) => {
    const query = `UPDATE users
       SET firstname = $1, lastname = $2, email = $3
        WHERE id = $4`;
    const params = [firstname, lastname, email, id];
    return db.query(query, params);
};

module.exports.updateUsersWithPass = (
    firstname,
    lastname,
    email,
    password,
    id
) => {
    return hashPassword(password).then((password_hash) => {
        const query = `UPDATE users
        SET firstname = $1, lastname = $2, email = $3, password_hash = $4
        WHERE users.id = $5`;
        const params = [firstname, lastname, email, password_hash, id];
        return db.query(query, params);
    });
};

module.exports.createOrUpdateProfiles = (age, city, url, user_id) => {
    const query = `INSERT INTO profiles (age, city, url, user_id)
             VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id)
           DO UPDATE SET age = $1 , city = $2, url = $3`;
    const params = [age, city, url, user_id];
    return db.query(query, params);
};

module.exports.deleteSignature = (id) => {
    const query = `DELETE
        FROM signatures
        WHERE user_id = $1`;
    const params = [id];
    return db.query(query, params);
};

// module.exports.updateProfilesIfPossible = (id) => {
//     const query = `UPDATE age, city, url
//         FROM profiles
//         WHERE user_id = $1`;
//     const params = [id];
//     return db.query(query, params);
// };

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

module.exports.addSigns = (signature, user_id) => {
    console.log("HERE IS A PROBLEM", signature, user_id);
    const query = `
        INSERT INTO signatures ( signature, user_id)
        VALUES ($1, $2)
        RETURNING *
    `;
    const params = [signature, user_id];
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

module.exports.addProfile = ({ age, city, url, user_id }) => {
    const query = `
       INSERT INTO profiles (age, city, url, user_id)
       VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const params = [age, city, url, user_id];
    return db.query(query, params);
};

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

module.exports.getSignatureAndNameByUserId = (user_id) => {
    const query = `SELECT signature, firstname
    FROM signatures 
    JOIN users
    ON users.id = signatures.user_id
    WHERE user_id = $1
    `;
    const params = [user_id];
    const foundSignature = db.query(query, params);
    return foundSignature;
};
module.exports.getFirstnameByUserId = (user_id) => {
    const query = `SELECT firstname FROM users WHERE id = $1`;
    const params = [user_id];
    const foundFirstname = db.query(query, params);
    return foundFirstname;
};

function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = $1`;
    const params = [email];
    const foundUser = db.query(query, params);
    return foundUser;
}
