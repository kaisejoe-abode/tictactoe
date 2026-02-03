# Using Docker for PostgreSQL

If you don't have PostgreSQL installed locally, you can use Docker:

## Start PostgreSQL with Docker Compose

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL on port 5432
- Create database `tictactoe`
- Set username/password to `postgres/postgres`

## Stop PostgreSQL

```bash
docker-compose down
```

## View logs

```bash
docker-compose logs -f
```

## Remove everything (including data)

```bash
docker-compose down -v
```

## Default Connection String

```
postgresql://postgres:postgres@localhost:5432/tictactoe
```

This is already set in `packages/backend/.env.example`
