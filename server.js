const express = require("express");
const app = express();
const { engine } = require("express-handlebars");
const db = require("./database/db");
const path = require("path");
const cookieSession = require("cookie-session");
const { redirect } = require("express/lib/response");


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
    res.redirect("/signup");
});
app.get("/petition", (req, res) => {
    const user_id = req.session.user_id;
    db.getSignatureAndNameByUserId(user_id)
        .then((foundSignature) => {
            if (foundSignature.rows.length > 0) {
                res.redirect("/thanks");
            } else if (!user_id) {
                res.redirect("/");
            } else {
                res.render("petition");
            }
        })
        .catch((err) => {
            res.render("petition", { err: true });
        });
});
app.post("/petition", (req, res) => {

    const { signature } = req.body;
    db.addSigns({ signature: signature, user_id: req.session.user_id })
        .then(() => {
            res.redirect("/thanks");
        })
        .catch((err) => {
            res.render("petition", { err: true });
        });
});

app.get("/profile", (req, res) => {
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
            const foundSignature = signature.rows[0].signature;
            const foundName = signature.rows[0].firstname;
            res.render("thanks", {
                imgData: foundSignature,
                foundName: foundName,
            });
        })
        .catch((err) => {
        });
});

app.post("/unsign", (req, res) => {
    const { user_id } = req.session;
    db.deleteSignature(user_id)
        .then((deletedSignature) => {
            res.redirect("/petition");
            //Set signed/sigId cookie from the cookie object value to be null
        })
        .catch((err) => {
        });
});

app.get("/signers/:city/", (req, res) => {
    const city = req.params;
    db.getCitySigners(city).then((result) => {
        res.render("city", {
            city: result.rows[0].city,
            signers: result.rows,
        });
    });
});

app.get("/signers", (req, res) => {
    db.getAllSignersProfiles().then((result) => {
        res.render("signers", { signers: result.rows });
    });
});
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
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

app.get("/signup", (req, res) => {
    res.render("signup");
});

app.post("/signup", (req, res) => {
    const { firstname, lastname, email, password } = req.body;

    if (!firstname || !lastname || !email || !password) {
        res.render("signup", { err: true });
        return;
    }
    db.addUser(req.body)
        .then((newUser) => {
            req.session.user_id = newUser.rows[0].id;
            res.redirect("/profile");
        })
        .catch((error) => {
            if (error.constraint === "users_email_key") {
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
            });
    }
});

app.post("/logout", (req, res) => {
    req.session.user_id = null;
    res.redirect("/signup");
});

app.listen(process.env.PORT || 8080);
