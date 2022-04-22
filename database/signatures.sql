
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS signatures;

DROP TABLE IF EXISTS users;



CREATE TABLE users (
    id SERIAL primary key,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (firstname, lastname, email, password_hash) 
VALUES ('Yulia', 'Grineva', 'yu@gmail.com', 'hifhibwhebihbfc');

INSERT INTO users (firstname, lastname, email, password_hash) 
VALUES ('Angela', 'Merkel', 'merk@gmail.com', 'hifhiddbwhebihbfc');

INSERT INTO users (firstname, lastname, email, password_hash) 
VALUES ('Olaf', 'Sholz', 'sholz@gmail.com', 'hifhikjsbwhebihbfc');




CREATE TABLE signatures (
    id SERIAL primary key,
    user_id INT NOT NULL UNIQUE REFERENCES users(id),
    signature TEXT
);

INSERT INTO signatures (signature, user_id) 
VALUES ('sign', 1);

INSERT INTO signatures ( signature, user_id) 
VALUES ('sign2', 2);

INSERT INTO signatures (signature, user_id) 
VALUES ('sign3', 3);

CREATE TABLE profiles (
    id SERIAL primary key,
    age INT,
    city VARCHAR,
    url VARCHAR,
    user_id INT NOT NULL UNIQUE REFERENCES users(id)
);

INSERT INTO profiles (age, city, url, user_id) 
VALUES (68, 'Berlin', 'https://spiced.space/aspartame/petition/', 1);

INSERT INTO profiles (age, city, url, user_id) 
VALUES (78, 'Berlin', 'https://translate.google.com/', 2);

INSERT INTO profiles (age, city, url, user_id) 
VALUES (88, 'Berlin', 'https://www.amazon.de/', 3);


SELECT * FROM users
JOIN signatures
ON users.id = signatures.user_id
JOIN profiles
ON users.id = profiles.user_id
WHERE profiles.city = 'Berlin';

