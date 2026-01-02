# Certificados Hyperledger Fabric

Esta pasta contém os certificados necessários para conexão com a rede Hyperledger Fabric.

## Estrutura esperada

```
certs/
├── aluno/
│   ├── ca.crt
│   ├── cert.pem
│   ├── key.pem
│   └── tls-ca.crt
├── coordenacao/
│   ├── ca.crt
│   ├── cert.pem
│   ├── key.pem
│   └── tls-ca.crt
├── orientador/
│   ├── ca.crt
│   ├── cert.pem
│   ├── key.pem
│   └── tls-ca.crt
├── orderer/
│   └── tls-ca.crt
└── README.md
```

## Como obter os certificados

### 1. A partir de uma rede Fabric existente

Se você já tem uma rede Fabric configurada, exporte os certificados do admin de cada organização:

```bash
# Exemplo para a organização Coordenacao
./scripts/export-admin-certs.sh coordenacao
```

### 2. Usando o Fabric CA

```bash
# Registrar e enrollar um usuário
fabric-ca-client register --id.name admin --id.secret adminpw --id.type admin
fabric-ca-client enroll -u https://admin:adminpw@ca.coordenacao.example.com:7054

# Os certificados serão gerados em:
# - msp/signcerts/cert.pem
# - msp/keystore/<key>.pem -> renomear para key.pem
# - msp/cacerts/ca.crt
# - msp/tlscacerts/tls-ca.crt
```

### 3. Copiando de um peer existente

```bash
# Copiar do container do peer
docker cp peer0.coordenacao.example.com:/etc/hyperledger/fabric/msp ./coordenacao-msp

# Organizar os arquivos conforme a estrutura acima
cp coordenacao-msp/signcerts/cert.pem ./certs/coordenacao/
cp coordenacao-msp/keystore/* ./certs/coordenacao/key.pem
cp coordenacao-msp/cacerts/* ./certs/coordenacao/ca.crt
cp coordenacao-msp/tlscacerts/* ./certs/coordenacao/tls-ca.crt
```

## Arquivos necessários

| Arquivo | Descrição |
|---------|-----------|
| `cert.pem` | Certificado de identidade do usuário |
| `key.pem` | Chave privada do usuário (SENSÍVEL) |
| `ca.crt` | Certificado da CA da organização |
| `tls-ca.crt` | Certificado da CA TLS para conexão segura |

## Segurança

⚠️ **IMPORTANTE**: Os arquivos `key.pem` contêm chaves privadas e **NUNCA** devem ser commitados no repositório.

A pasta `certs/*/` está no `.gitignore` por segurança.
