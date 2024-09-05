const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());

// Configuração do CORS
app.use(cors({
  origin: '*', // Permitir todas as origens durante o desenvolvimento
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

// Configuração da conexão com o banco de dados
const connectionConfig = {
  host: '69.49.241.39',
  user: 'vini0579_admin',
  password: 'Aa@38921385',
  database: 'vini0579_login_db'
};

let connection;

// Função para tentar conectar ao banco de dados
function handleDisconnect() {
  connection = mysql.createConnection(connectionConfig);

  connection.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ou reconectar:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Conectado ao banco de dados MySQL!');
    }
  });

  connection.on('error', (err) => {
    console.error('Erro na conexão com o banco de dados:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Tentando reconectar...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

// Chamar a função para estabelecer a conexão inicial
handleDisconnect();

// Função para verificar o nível de acesso
function checkAccessLevel(requiredLevel) {
  return (req, res, next) => {
    if (req.user && req.user.access_level >= requiredLevel) {
      next();
    } else {
      res.status(403).json({ message: 'Acesso negado' });
    }
  };
}

// Middleware de autenticação (simplificado para exemplo)
app.use((req, res, next) => {
  // Simular um usuário autenticado
  // Em uma aplicação real, você deve autenticar o usuário de forma segura (ex: JWT)
  req.user = { access_level: 1 }; // Exemplo: usuário com nível de acesso 1
  next();
});

// Rota de autenticação
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], (err, results) => {
    if (err) {
      console.error('Erro ao verificar credenciais:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (results.length > 0) {
      const user = results[0];
      
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Erro ao comparar senha:', err);
          return res.status(500).json({ message: 'Erro interno do servidor' });
        }

        if (isMatch) {
          res.status(200).json({ success: true, username: user.username, access_level: user.access_level });
        } else {
          res.status(401).json({ success: false, message: 'Usuário ou senha incorretos' });
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Usuário ou senha incorretos' });
    }
  });
});

// Rota para adicionar um usuário
app.post('/register', (req, res) => {
  const { username, password, access_level } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Erro ao criptografar senha:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    const query = 'INSERT INTO users (username, password, access_level) VALUES (?, ?, ?)';
    connection.query(query, [username, hash, access_level || 0], (err, result) => {
      if (err) {
        console.error('Erro ao registrar usuário:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }
      res.status(201).json({ id: result.insertId });
    });
  });
});

// Rota para inserir máquina (somente usuários com nível de acesso >= 1)
app.post('/machines', checkAccessLevel(1), (req, res) => {
  const { cod, productName, reference, stockLocation, obs } = req.body;

  if (!cod || !productName || !reference || !stockLocation) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
  }

  const query = 'SELECT * FROM machines WHERE cod = ?';
  connection.query(query, [cod], (err, results) => {
    if (err) {
      console.error('Erro ao verificar duplicatas:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Código da máquina já existe no banco de dados' });
    }

    const insertQuery = 'INSERT INTO machines (cod, productName, reference, stockLocation, obs) VALUES (?, ?, ?, ?, ?)';
    connection.query(insertQuery, [cod, productName, reference, stockLocation, obs], (err, result) => {
      if (err) {
        console.error('Erro ao inserir máquina:', err);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }
      res.status(201).json({ id: result.insertId });
    });
  });
});

// Rota para listar todas as máquinas
app.get('/machines', (req, res) => {
  const query = 'SELECT * FROM machines';
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao carregar máquinas:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
    res.status(200).json(results);
  });
});

// Rota para listar manutenções de uma máquina específica
app.get('/machines/:id/maintenances', (req, res) => {
  const machineId = req.params.id;

  const query = 'SELECT * FROM maintenances WHERE machine_id = ?';
  connection.query(query, [machineId], (err, results) => {
    if (err) {
      console.error('Erro ao carregar manutenções:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
    res.status(200).json(results);
  });
});

// Rota para adicionar manutenção a uma máquina específica
app.post('/machines/:id/maintenances', checkAccessLevel(1), (req, res) => {
  const machineId = req.params.id;
  const { maintenanceType, date, notes, status } = req.body;

  if (!maintenanceType || !date || !status) {
    return res.status(400).json({ message: 'Campos obrigatórios para manutenção não foram preenchidos' });
  }

  const insertQuery = 'INSERT INTO maintenances (machine_id, maintenanceType, date, notes, status) VALUES (?, ?, ?, ?, ?)';
  connection.query(insertQuery, [machineId, maintenanceType, date, notes, status], (err, result) => {
    if (err) {
      console.error('Erro ao adicionar manutenção:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
    res.status(201).json({ id: result.insertId, message: 'Manutenção adicionada com sucesso' });
  });
});

// Rota para editar uma máquina existente (somente usuários com nível de acesso >= 1)
app.put('/machines/:id', checkAccessLevel(1), (req, res) => {
  const machineId = req.params.id;
  const { cod, productName, reference, stockLocation, obs } = req.body;

  if (!cod || !productName || !reference || !stockLocation) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
  }

  const updateQuery = 'UPDATE machines SET cod = ?, productName = ?, reference = ?, stockLocation = ?, obs = ? WHERE id = ?';
  connection.query(updateQuery, [cod, productName, reference, stockLocation, obs, machineId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar máquina:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }

    res.status(200).json({ message: 'Máquina atualizada com sucesso' });
  });
});

// Rota para excluir uma máquina (somente usuários com nível de acesso >= 1)
app.delete('/machines/:id', checkAccessLevel(1), (req, res) => {
  const machineId = req.params.id;

  const deleteQuery = 'DELETE FROM machines WHERE id = ?';
  connection.query(deleteQuery, [machineId], (err, result) => {
    if (err) {
      console.error('Erro ao excluir máquina:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }

    res.status(200).json({ message: 'Máquina excluída com sucesso' });
  });
});

// Rota para editar manutenções (somente usuários com nível de acesso >= 2)
app.put('/maintenances/:id', checkAccessLevel(2), (req, res) => {
  const maintenanceId = req.params.id;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status é obrigatório' });
  }

  const query = 'UPDATE maintenances SET status = ?, notes = ? WHERE id = ?';
  connection.query(query, [status, notes, maintenanceId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar manutenção:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
    res.status(200).json({ message: 'Manutenção atualizada com sucesso' });
  });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
