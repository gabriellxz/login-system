const express = require("express");
let cors = require('cors');
const Yup = require('yup');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jtw = require('jsonwebtoken');
require('dotenv').config();

const { eAdmin } = require('./middlewares/auth');
const User = require('./models/User');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization")
    app.use(cors());
    next();
});

app.get("/users", eAdmin, async (req, res) => {

    await User.findAll({
        attributes: ['id', 'name', 'email', 'password'],
        order: [['id', 'DESC']]
    })
        .then((users) => {
            return res.json({
                erro: false,
                users
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Nenhum usuário encontrado!"
            });
        });
});

app.get("/user/:id", eAdmin, async (req, res) => {
    const { id } = req.params;

    //await User.findAll({ where: { id: id } })
    await User.findByPk(id)
        .then((user) => {
            return res.json({
                erro: false,
                user: user
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Nenhum usuário encontrado!"
            });
        });
});

app.post("/user", async (req, res) => {

    const schema = Yup.object().shape({
        name: Yup.string()
            .required(),
        email: Yup.string()
            .email()
            .required(),
        password: Yup.string()
            .required()
            .min(8)

    });

    if (!(await schema.isValid(req.body))) {
        return res.status(400).json({
            erro: true,
            code: 101,
            mensagem: "Erro: dados invalidos"
        });
    }

    let dados = req.body;
    dados.password = await bcrypt.hash(dados.password, 8);

    await User.create(dados)
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário cadastrado com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não cadastrado..."
            });
        });
});

app.put("/user", eAdmin, async (req, res) => {
    const { id } = req.body;

    await User.update(req.body, { where: { id } })
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário editado com sucesso!"
            });

        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não editado com sucesso!"
            });
        });
});

app.put("/user-senha", eAdmin, async (req, res) => {
    const { id, password } = req.body;

    var senhaCrypt = await bcrypt.hash(password, 8);

    await User.update({ password: senhaCrypt }, { where: { id } })
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Senha editada com sucesso!"
            });

        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Senha não editada com sucesso!"
            });
        });
});

app.delete("/user/:id", eAdmin, async (req, res) => {
    const { id } = req.params;

    await User.destroy({ where: { id } })
        .then(() => {
            return res.json({
                erro: false,
                mensagem: "Usuário apagado com sucesso!"
            });
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Usuário não apagado com sucesso!"
            });
        });
});

app.post('/login', async (req, res) => {
    const user = await User.findOne({
        attributes: ['id', 'name', 'email', 'password'],
        where: {
            email: req.body.email
        }
    });
    if (user === null) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Usuário ou a senha incorreta!"
        });
    };

    if (!(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(400).json({
            erro: true,
            mensagem: "Erro: Usuário ou a senha incorreta!"
        });
    };

    let token = jtw.sign({ id: user.id }, process.env.SECRET, {

        expiresIn: '24h',
    });

    return res.json({
        erro: false,
        mensagem: "Login realizado com sucesso!",
        token
    });
});


app.get('/validar-token', eAdmin, async (req, res) => {
    await User.findByPk(req.userId, { attributes: ['name', 'email'] }).then((user) => {
        return res.json({
            erro: false,
            user
        }).catch(() => {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Necessário realizar o login para acessar a página!"
            });
        })
    })

})


app.post('/recover-password', async (req, res) => {




    let transport = nodemailer.createTransport({
        host: "sandbox.smtp.gmail.io",
        port: 2525,
        auth: {
            user: "a418eb509b5417",
            pass: "0294bc004e63b1"
        }
    });

    let message = {
        from: "sender@server.com",
        to: "receiver@sender.com",
        subject: "Message title",
        text: "Bora",
        html: "<p>HTML version of the message</p>"
    };

    await transport.sendMail(message, (err) => {
        if (err) return res.status(400).json({
            erro: true,
            mensagem: "email não enviado!"
        });
        return res.json({
            erro: false,
            mensagem: "email enviado com sucesso!"
        })
    })
});

/*const user = await User.findOne({
    attributes: ['id', 'name', 'email', 'password'],
    where: {
        email: req.body.email
    }
});
if (user === null) {
    return res.status(400).json({
        erro: true,
        mensagem: "Erro: Usuário ou a senha incorreta!"
    });
};

if (!(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).json({
        erro: true,
        mensagem: "Erro: Usuário ou a senha incorreta!"
    });
};

let token = jtw.sign({ id: user.id }, process.env.SECRET, {

    expiresIn: '24h',
});

return res.json({
    erro: false,
    mensagem: "Login realizado com sucesso!",
    token
});*/


app.listen(8080, () => {
    console.log("Servidor iniciado na porta 8080: http://localhost:8080");
});