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
        id_cliente text not null unique,
        valor numeric(10,2) not null,
        numero_sala integer not null)
    `);

    // a tabela já existia sem id_cliente: adiciona a coluna sem perder dados
    await pool.query(
      "alter table ingressos add column if not exists id_cliente text unique",
    );

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

await pool.query(
  "alter table ingressos add column if not exists id_cliente text unique",
);


app.get("/ingressos", async (req, res) => {
  try {
    const resultado = await pool.query(
      "select id, id_cliente, valor, numero_sala from ingressos order by id desc",
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
      const { idCliente, valor, numeroSala } = req.body;

  if (!idCliente || !valor || !numeroSala) {
    return res.status(400).json({
      erro: "idCliente, valor e numeroSala são obrigatórios",
    });
  }

  const resultado = await pool.query(
    `insert into ingressos (id_cliente, valor, numero_sala)
    values ($1, $2, $3)
    on conflict (id_cliente) do nothing
    returning id, id_cliente, valor, numero_sala`,
    [idCliente, valor, numeroSala],
  );

  if (resultado.rows.length === 0) {
    // esse idCliente já existia: não duplica e responde sucesso
    const existente = await pool.query(
      "select id, id_cliente, valor, numero_sala from ingressos where id_cliente = $1",
      [idCliente],
    );

    return res.status(200).json({
      mensagem: "Ingresso já estava sincronizado",
      ingresso: existente.rows[0],
    });
  }

  res.status(201).json({
    mensagem: "Ingresso cadastrado com sucesso",
    ingresso: resultado.rows[0],
  });
  } catch (erro) {
    console.error("Erro ao cadastrar ingresso:", erro);

    res.status(500).json({
      erro: "Erro Interno do Servidor...",
    });
  }
});

const porta = process.env.PORT || 3000;

app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} ...`);
});

