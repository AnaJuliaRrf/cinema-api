const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("api cinema funcionando");
});

app.get("/teste-banco", async (req, res) => {
  try {
    const resultado = await pool.query("select now()");

    res.json({
      mensagem: "Conexão com o banco realizada com sucesso",
      dataHoraBanco: resultado.rows[0].now,
    });
  } catch (erro) {
    console.error("Erro ao conectar com o banco:", erro);

    res.status(500).json({
      erro: "Erro interno do servidor...",
    });
  }
});

app.get("/criar-tabela-ingressos", async (req, res) => {
  try {
    await pool.query(`
      create table if not exists ingressos (
        id serial primary key,
        valor numeric(10,2) not null,
        numero_sala integer not null
      )
    `);

    res.json({
      mensagem: "Tabela ingressos criada com sucesso",
    });
  } catch (erro) {
    console.error("Erro ao criar tabela:", erro);

    res.status(500).json({
      erro: "Erro ao criar tabela ingressos",
    });
  }
});

app.get("/ingressos", async (req, res) => {
  try {
    const resultado = await pool.query(
      "select id, valor, numero_sala from ingressos order by id desc",
    );

    res.json(resultado.rows);
  } catch (erro) {
    console.error("erro ao buscar ingressos:", erro);

    res.status(500).json({
      erro: "Erro Interno do servidor...",
    });
  }
});

app.post("/ingressos", async (req, res) => {
  try {
    const { valor, numeroSala } = req.body;

    if (!valor || !numeroSala) {
      return res.status(400).json({
        erro: "valor e numeroSala são obrigatórios",
      });
    }

    const resultado = await pool.query(
      `insert into ingressos (valor, numero_sala)
       values ($1, $2)
       returning id, valor, numero_sala`,
      [valor, numeroSala],
    );

    res.status(201).json({
      mensagem: "Ingresso cadastrado com sucesso",
      ingresso: resultado.rows[0],
    });
  } catch (erro) {
    console.error("Erro ao cadastrar Ingresso:", erro);

    res.status(500).json({
      erro: "Erro Interno do Servidor...",
    });
  }
});

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} ...`);
});

