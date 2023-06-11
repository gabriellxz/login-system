const jwt = require('jsonwebtoken');
const { promisify } = require('util');
require('dotenv').config();


module.exports = {
    
    eAdmin: async function (req, res, next) {
 
       
        //return res.json({messagem: "Validar token"});
        const authHeader = req.headers.authorization;
        const [bearer, token] = authHeader.split(' ');
        
        if (!authHeader) {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Necessário realizar o login para acessar a página!"
            });
        };

        if (!token) {
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Necessário realizar o login para acessar a página!"
            });
        };
    
        try {
            const decoded = await promisify(jwt.verify)(token, process.env.SECRET);
            req.userId = decoded.id;
    
            return next();
        } catch (err) {
            return res.status(401).json({
                erro: true,
                mensagem: "Erro: Necessário realizar o login para acessar a página!"
            });
            
            
        }
        
       
    }

    
    
};


//validação com node;
 /*  const schema = Yup .object().shape({
    name: Yup.string()
    .required(),
email: Yup.string()
    .email()
    .required(),
password: Yup.string()
    .required()
    .min(8)

});

if(!(await schema.isValid(req.body))){
return res.status(400).json({
    erro: true,
    code: 101,
    mensagem: "Erro: dados invalidos"
});
}
*/