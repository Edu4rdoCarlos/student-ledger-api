# Academic Ledger API

API para gerenciamento de documentos acadêmicos com blockchain (Hyperledger Fabric) e armazenamento descentralizado (IPFS).

## Sobre o Projeto

Sistema de gerenciamento de TCCs que registra documentos acadêmicos em blockchain, garantindo imutabilidade e rastreabilidade. Os arquivos são armazenados no IPFS e seus hashes são registrados na blockchain.

**Principais funcionalidades:**
- Gestão de alunos, orientadores e coordenadores
- Submissão e aprovação de documentos
- Agendamento de defesas
- Registro imutável em blockchain

## Tecnologias

- **NestJS** - Framework backend
- **PostgreSQL** - Banco de dados
- **Hyperledger Fabric** - Blockchain permissionada
- **IPFS** - Armazenamento descentralizado
- **Redis** - Filas e cache
- **Prisma** - ORM

## Arquitetura

O projeto segue a **Arquitetura Hexagonal** (Ports and Adapters), organizando o código em camadas:

```
src/core/modules/[modulo]/
├── domain/        # Regras de negócio e entidades
├── application/   # Casos de uso e portas
├── infra/         # Implementações (repositórios, serviços externos)
└── presentation/  # Controllers e DTOs
```

## Como Rodar

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- Rede Hyperledger Fabric configurada (externa)

### Instalação

1. Clone o repositório e instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o .env com suas configurações
```

3. Suba os serviços (PostgreSQL e Redis):
```bash
docker-compose up -d postgres redis
```

4. Execute as migrations do banco:
```bash
npm run prisma:migrate
```

5. (Opcional) Popule o banco com dados iniciais:
```bash
npm run prisma:seed
```

6. Inicie a aplicação:
```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

### Com Docker (completo)

```bash
docker-compose up -d
```

A API estará disponível em `http://localhost:8080`.

## Documentação da API

Acesse a documentação Swagger em: `http://localhost:3000/api`

## Scripts Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Inicia em modo desenvolvimento |
| `npm run build` | Compila o projeto |
| `npm run test` | Executa os testes |
| `npm run prisma:studio` | Abre o Prisma Studio |
| `npm run lint` | Executa o linter |
