const express = require('express');
const app = express();
const path = require('path');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const sha256 = require('sha256');
const mysql = require('mysql');
const nodemailer = require('nodemailer');
const SECRET = "!'q5;Jvi0`*#^1d=)D*^x87J2Ps4.#>W(DE5#34=Rlj%ipU~lXri7JuHK-ftxAP";
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'economic'
});
// const pool = mysql.createPool({
//     connectionLimit: 10,
//     host: 'localhost',
//     user: 'econjvtu_pollo',
//     password: '7sp0rJhx2KF-',
//     database: 'econjvtu_economic'
// });
console.log(global.__basedir = __dirname);
app.use(express.static('public'), (req, res, next) => {
    console.log(req.query);
    if (req.query.redirect) {
        res.redirect(req.query.redirect);
    }
    next();
});
app.get('/login', function (req, res, ) {
    console.log('Usuario ingreso a login');
    res.sendFile(path.join(__dirname, '../public/login.html'));
});
app.get('/register', function (req, res) {
    console.log('Usuario ingreso a register');
    res.sendFile(path.join(__dirname, '../public/register.html'));
});
app.get('/forgot', function (req, res,next) {
    console.log('Usuario ingreso a forgot');
    console.log(req.query);
    if (req.query.token) {
        let token_validar = validar_token(req.query.token);
        if (token_validar) {
            res.sendFile(path.join(__dirname, '../public/changepass.html'));
        }
        else {
            res.redirect("/forgot?error=token_invalid");
        }
    } else {
        res.sendFile(path.join(__dirname, '../public/forgot.html'));
    }
});
app.get('/forgot/:dato', function (req, res, next) {
        console.log('pene');
        next();
    // res.sendFile(path.join(__dirname, '../public/forgot.html'));
});
app.get('/dashboard', function (req, res) {
    console.log('Usuario ingreso a dashboard');
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});
app.get('/courses', function (req, res) {
    console.log('Usuario ingreso a cursos');
    res.sendFile(path.join(__dirname, '../public/courses.html'));
});
app.get('*', function (req, res) {
});
// app.get('/', function (req, res) {
//     console.log('Usuario ingreso a login');
//     res.sendFile(path.join(__dirname, '../public/login.html'));
//     });
    
io.on('connection', function (socket) {
        console.log('Nuevo usuario');

    socket.on('dashboard', (token) => {
        console.log('hola' + token);
            let validar = validar_token(token);
            if(validar)
            {
                let email = objeto[1];
                pool.getConnection((err, connection) => {
                    connection.query('SELECT * FROM users WHERE EMAIL = ?', [email], function (err, res, fields) {
                        socket.emit('bienvenida', (res[0].NAME));
                        connection.release();
                    });
                });
            }else{
                socket.emit('logout');
            }

    });

    socket.on('changepass',(token,newpass)=>{
        let val_token = validar_token(token);

        if(val_token){

        }
        else{
            socket.emit('logout');
        }
    });

    socket.on('forgot',(email)=>{
        let val = validar('forgot',email);

        if(val)
        {
            forgot(email,socket);
        }
        else{
            socket.emit('notification', 'Ha ocurrido un problema', 'ser', 'error');
        }
    });

    socket.on('register', (name, email, pass) => {
        let val_reg = validar('reg', name, email, pass);
        if (val_reg) {
            reg_new_user(name, email, pass,socket);
        } else {
            socket.emit('notification', 'Ha ocurrido un problema', 'ser', 'error');
        }
    });
    socket.on('login', (email, pass) => {
        console.log(email);
        let val = validar('', '', email, pass, '', '');
        if (val) {
            pool.getConnection((err, connection) => {
                connection.query('SELECT * FROM users WHERE EMAIL = ?', [email], function (err, res, fields) {
                    connection.release();
                    console.log(res[0]);
                    newpass = sha256(pass)
                    if (res[0]) {
                        if (newpass == res[0].PASS) {
                            let token = new_token(email);
                            console.log(token);
                            socket.emit('logear', token);
                        }
                        else {
                            socket.emit('notification', 'Contraseña incorrecta');
                        }
                    }
                    else {
                        socket.emit('notification', 'Correo electronico no existente');
                    }

                });
            });
        } else {
            socket.emit('notification', 'Ha ocurrido un problema', 'ser', 'error');
        }
    });
});
function error(socket,e){
    socket.emit('pene');
}
function forgot(email,socket){
    pool.getConnection((err,connection)=>{
        connection.query('SELECT * FROM users WHERE EMAIL = ?',[email],(err,res,fields)=>{
            if(res[0]){
                let date = new Date();
                socket.emit('token-new-pass-forgot');
                let token = new_token(email);
                sendemail(email,token,'forgopass');
            }else{
                socket.emit('notification', 'Correo electronico no existente','ser','error');
            }
        });
    });
}

async function sendemail(email,token,tipo)
{
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "reymisteriotutos@gmail.com",
            pass: "daja120."
        }
    });

    let mailOptions = {
        from: '"Economic Academy" <economicacademyla@noreply.com>', // sender address
        to: "reymisteriotutos@gmail.com", // list of receivers
        subject: "Forgot Password", // Subject line
        html: `<b>Utilice este<a href='http://localhost:8080/forgot?token=${token}'>link</a></b>` // html body
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function rndate() {
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1;
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();

    return year + "/" + month + "/" + day;
}
function reg_new_user(name, email, pass, socket) {
    let encrypted_pass = sha256(pass);
    let newdate = rndate();
    let data =
    {
        NAME: name,
        EMAIL: email,
        PASS: encrypted_pass,
        CREATED: newdate
    }
    pool.getConnection((err, connection) => {
        connection.query('SELECT * FROM users WHERE EMAIL = ?', [email], function (err, res, fields) {
            if (res[0]) {
                connection.release();
                socket.emit('notification', 'Correo Electronico en uso.', 'ser', 'error');
            } else {
                connection.query('INSERT INTO users SET ?', data, function (err, res, fields) {
                    connection.release();
                    if (err) { console.log(err); } else {
                        let token = new_token(email, res.insertId);

                        socket.emit('logear', token);
                    }
                });
            }
        });
    });


}

function validar_token(token) {
    if(!token){
        return false;
    }else{
        let objeto = token.split('$');
        let val_token = sha256(SECRET+objeto[1]+objeto[2])
        if(val_token == objeto[0])
        {
            const EXP_TIME = 1000 * 60 * 60 * 2;
            let date = new Date().getTime();
            let check_expired = parseInt(objeto[2]) + EXP_TIME;
            console.log(date);
            console.log(check_expired);
            if(date > check_expired)
            {
                return false;
            }
            else{
                return true;
            }
        }
        else{
            return false;
        }
    }
        }

function new_token(email){
    let issued = new Date();
    let token = sha256(SECRET + email + issued.getTime());
    console.log(`${token}$${email}$${issued.getTime()}`);
    return `${token}$${email}$${issued.getTime()}`;
}
function validar(tipo, name, email, pass) {
    let reg = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}/g;
    if (tipo == 'reg') {
        if (name == "") {
            return false;
        }
        else if (email == "") {
            return false;
        }
        else if (!(reg.test(email))) {
            return false;
        }
        else if (pass == "") {
            return false;
        }
        else {
            return true;
        }
    }else if(tipo == "forgot"){
        if(email == "")
        {
            return false;
        }
        else{
            return true;
        }
    } else {
        if (email == "") {
            return false;
        }
        else if (!(reg.test(email))) {
            return false;
        }
        else if (pass == "") {
            return false;
        }
        else {
            return true;
        }
    }
}



server.listen(8080);

console.log('Server iniciado');