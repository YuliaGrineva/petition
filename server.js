const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const db = require("./database/db");
const path = require("path");
const cookieSession = require("cookie-session");
const { redirect } = require("express/lib/response");

console.log(db);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(express.static("./public"));
app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.get("/", (req, res) => {
    console.log("GET request made to / route");
    res.redirect("/signup");
});
app.get("/petition", (req, res) => {
    console.log("GET request made to /petition route");
    const user_id = req.session.user_id;
    console.log("user_id", user_id);
    db.getSignatureAndNameByUserId(user_id)
        .then((foundSignature) => {
            console.log(foundSignature);
            if (foundSignature.rows.length > 0) {
                console.log("the problem is here");
                res.redirect("/thanks");
            } else if (!user_id) {
                res.redirect("/");
            } else {
                res.render("petition");
            }
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("petition", { err: true });
        });
});
app.post("/petition", (req, res) => {
    console.log("POST to /petition", req.session);

    const { signature } = req.body;
    console.log("Works?", signature);
    db.addSigns({ signature: signature, user_id: req.session.user_id })
        .then(() => {
            //req.session.user_id = newSign.rows[0].user_id;
            //req.session.user_id = rows[0].user_id;
            //signature ID in cookie packen
            console.log("hahaha");
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("err: ", err);
            res.render("petition", { err: true });
        });
});

app.get("/profile", (req, res) => {
    console.log("GET request made to /profile route");
    res.render("profile");
});

app.post("/profile", (req, res) => {
    const { age, city, url } = req.body;
    if (!age && !city && !url) {
        res.redirect("/petition");
        return;
    }
    db.addProfile({
        age: parseInt(age),
        city: city,
        url: url,
        user_id: req.session.user_id,
    }).then((newProfile) => {
        req.session.user_id = newProfile.rows[0].id;
        res.redirect("/petition");
    });
});

app.get("/thanks", (req, res) => {
    const { user_id } = req.session;

    db.getSignatureAndNameByUserId(user_id)

        .then((signature) => {
            if (signature.rows.length == 0) {
                res.redirect("/petition");
                return;
            }
            console.log("Signature:", signature);
            const foundSignature = signature.rows[0].signature;
            const foundName = signature.rows[0].firstname;
            console.log("foundSignature:", foundSignature);
            res.render("thanks", {
                imgData: foundSignature,
                foundName: foundName,
            });
        })
        .catch((err) => {
            console.log(err);
        });
});

app.post("/unsign", (req, res) => {
    const { user_id } = req.session;
    db.deleteSignature(user_id)
        .then((deletedSignature) => {
            console.log("Sucsess!!!!");
            res.redirect("/petition");
            //Set signed/sigId cookie from the cookie object value to be null
        })
        .catch((err) => {
            console.log(err);
        });
});

app.get("/signers/:city/", (req, res) => {
    const city = req.params;
    console.log("HERE", city);
    db.getCitySigners(city).then((result) => {
        console.log(result);
        res.render("city", {
            city: result.rows[0].city,
            signers: result.rows,
        });
        console.log("HERE", result.rows);
    });
});

app.get("/signers", (req, res) => {
    console.log("GET request made to /signers route");
    // const { firstname, lastname, age, city } = req.body;
    db.getAllSignersProfiles().then((result) => {
        console.log(result);
        res.render("signers", { signers: result.rows });
    });
});
app.get("/login", (req, res) => {
    console.log("GET request made to /login route");
    // if (email, password ) {

    //     console.log();
    //     res.redirect("/petition");
    //     return;
    // } else {
    res.render("login");
    // }
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    console.log("POST to /login", req.body);
    if (!email || !password) {
        res.render("login", { err: true });

        return;
    }
    db.checkLogin(req.body).then((user) => {
        if (!user) {
            res.render("login", { err2: true });
        } else {
            req.session.user_id = user.id;
            res.redirect("/petition");
        }
        return;
    });
});

// app.post("/logout", (req, res) => {
//     req.session = null;
//     res.redirect("/petition");
// });

app.get("/signup", (req, res) => {
    console.log("GET request made to /signup route");
    res.render("signup");
});

app.post("/signup", (req, res) => {
    console.log("POST request made to /signup route");
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
        res.render("signup", { err: true });
        return;
    }
    db.addUser(req.body)
        .then((newUser) => {
            req.session.user_id = newUser.rows[0].id;
            console.log("HEREEEE", newUser.rows[0].id);
            res.redirect("/profile");
        })
        .catch((error) => {
            if (error.constraint === "users_email_key") {
                console.log("error", error);
                res.render("signup", { err2: true });
            }
        });
});

app.get("/profile/editing", (req, res) => {
    db.prePopulated(req.session.user_id).then(({ rows }) => {
        res.render("editing", { rows: rows[0] });
    });
});

app.post("/profile/editing", (req, res) => {
    const { firstname, lastname, email, password, age, city, url } = req.body;
    console.log("Works?", firstname, lastname, email, password, age, city, url);
    console.log(req.body);
    if (!req.body.password) {
        if (!firstname || !lastname || !email) {
            res.redirect("/profile/editing");
            return;
        }
        Promise.all([
            db.createOrUpdateProfiles(age, city, url, req.session.user_id),
            db.updateUsersNoPass(
                firstname,
                lastname,
                email,
                req.session.user_id
            ),
        ])
            .then(() => {
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log(err);
            });
    } else {
        Promise.all([
            db.createOrUpdateProfiles(age, city, url, req.session.user_id),
            db.updateUsersWithPass(
                firstname,
                lastname,
                email,
                password,
                req.session.user_id
            ),
        ])
            .then(() => {
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log(err);
            });
    }
});

app.post("/logout", (req, res) => {
    console.log("we are loggin out");
    req.session.user_id = null;
    res.redirect("/signup");
});

app.listen(process.env.PORT || 8080);
