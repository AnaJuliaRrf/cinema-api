# cinema-api

API REST do aplicativo **Ingressos de Cinema** (Flutter), desenvolvida para a
disciplina de Programação para Dispositivos Móveis II.

- **Temática:** Cinema (entidade `IngressoCinema`)
- **Estudante:** Ana Júlia Ferreira Rodrigues
- **API publicada:** https://cinemaprojeto.onrender.com
- **Repositório do app Flutter:** https://github.com/AnaJuliaRrf/CinemaProjeto

## Descrição

A API recebe e lista os ingressos de cinema (valor do ingresso e número da
sala) cadastrados no aplicativo e os grava em um banco PostgreSQL hospedado no
Render. Cada ingresso tem um `id_cliente` (UUID gerado no app), que permite ao
aplicativo reenviar registros pendentes na sincronização sem criar duplicatas.

## Tecnologias

- Node.js + Express
- PostgreSQL (biblioteca `pg`)
- `cors` e `dotenv`
- Hospedagem: Render (API e banco)

## Arquitetura

```
App Flutter ── HTTP/JSON ──► cinema-api (Express, Render) ──► PostgreSQL (Render)
```

O aplicativo nunca acessa o banco diretamente; toda comunicação passa por esta API.

## Tabela `ingressos`

| Coluna        | Tipo            | Observação                          |
| ------------- | --------------- | ----------------------------------- |
| `id`          | `serial`        | Chave primária                      |
| `id_cliente`  | `text`          | UUID gerado no app, único           |
| `valor`       | `numeric(10,2)` | Valor do ingresso                   |
| `numero_sala` | `integer`       | Número da sala                      |

## Rotas

| Método | Rota                      | Função                                                   |
| ------ | ------------------------- | -------------------------------------------------------- |
| GET    | `/`                       | Teste de vida da API                                     |
| GET    | `/teste-banco`            | Testa a conexão com o PostgreSQL                         |
| GET    | `/criar-tabela-ingressos` | Cria a tabela ou adiciona as colunas que faltam (rodar uma vez) |
| GET    | `/ingressos`              | Lista os ingressos                                       |
| POST   | `/ingressos`              | Cadastra um ingresso                                     |

### GET `/ingressos`

Lista os ingressos do mais recente para o mais antigo.

```json
[
  {
    "id": 8,
    "id_cliente": "fd6542b1-e4cb-4782-9d43-da76647cc105",
    "valor": "40.00",
    "numero_sala": 6
  }
]
```

> `valor` vem como texto porque é `numeric` no PostgreSQL.

### POST `/ingressos`

Corpo da requisição (JSON, `Content-Type: application/json`):

```json
{
  "idCliente": "fd6542b1-e4cb-4782-9d43-da76647cc105",
  "valor": 40.00,
  "numeroSala": 6
}
```

| Status | Significado                                                   |
| ------ | ------------------------------------------------------------- |
| `201`  | Ingresso cadastrado                                           |
| `200`  | Esse `idCliente` já existia; nada é duplicado                 |
| `400`  | `idCliente`, `valor` ou `numeroSala` ausente                  |
| `500`  | Erro interno do servidor                                      |

Resposta de sucesso:

```json
{
  "mensagem": "Ingresso cadastrado com sucesso",
  "ingresso": {
    "id": 8,
    "id_cliente": "fd6542b1-e4cb-4782-9d43-da76647cc105",
    "valor": "40.00",
    "numero_sala": 6
  }
}
```

Exemplo com `curl`:

```bash
curl -X POST https://cinemaprojeto.onrender.com/ingressos \
  -H "Content-Type: application/json" \
  -d '{"idCliente":"3f1c2a9e-8b7d-4c1e-9a2f-5d6e7f8a9b0c","valor":18.90,"numeroSala":8}'
```

## Como rodar localmente

Requisitos: Node.js 18+ e um banco PostgreSQL.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie um arquivo `.env` na raiz com a string de conexão do banco
   (o arquivo está no `.gitignore` e não deve ser enviado ao Git):

   ```
   DATABASE_URL=postgresql://usuario:senha@host:5432/banco
   ```

3. Inicie o servidor (porta 3000 por padrão, ou a definida em `PORT`):

   ```bash
   npm start
   ```

4. Na primeira execução, acesse `http://localhost:3000/criar-tabela-ingressos`
   para criar a tabela.

## Deploy no Render

- **Build command:** `npm install`
- **Start command:** `npm start`
- **Variável de ambiente:** `DATABASE_URL` com a *Internal Database URL* do
  PostgreSQL do Render.
- Após o primeiro deploy, acessar uma vez `/criar-tabela-ingressos`.

> No plano gratuito o serviço "dorme" após um período sem uso; a primeira
> requisição pode levar cerca de 1 minuto para responder.
