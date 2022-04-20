DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL primary key,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    signature TEXT
);

INSERT INTO signatures (firstname, lastname, signature) 
VALUES ('Yulia', 'Grineva', 'sign');

INSERT INTO signatures (firstname, lastname, signature) 
VALUES ('Angela', 'Merkel', 'sign2');

INSERT INTO signatures (firstname, lastname, signature) 
VALUES ('Olaf', 'Scholz', 'sign3');