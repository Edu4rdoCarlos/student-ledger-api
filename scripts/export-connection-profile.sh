#!/bin/bash
# Script para gerar connection profile para o backend

set -e

# Diretórios
FABRIC_DIR="${FABRIC_DIR:-/Users/dudu/Documents/Faculdade/TCC/Projeto/student-ledger/fabric}"
OUTPUT_FILE="${1:-./connection-profile.json}"

echo "Gerando connection profile..."

cat > "$OUTPUT_FILE" <<EOF
{
  "name": "student-ledger-network",
  "version": "1.0.0",
  "client": {
    "organization": "Coordenacao",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        },
        "orderer": "300"
      }
    }
  },
  "channels": {
    "studentchannel": {
      "orderers": [
        "orderer"
      ],
      "peers": {
        "peer0.coordenacao.ifal.local": {
          "endorsingPeer": true,
          "chaincodeQuery": true,
          "ledgerQuery": true,
          "eventSource": true
        },
        "peer0.orientador.ifal.local": {
          "endorsingPeer": true,
          "chaincodeQuery": true,
          "ledgerQuery": true,
          "eventSource": true
        },
        "peer0.aluno.ifal.local": {
          "endorsingPeer": true,
          "chaincodeQuery": true,
          "ledgerQuery": true,
          "eventSource": true
        }
      }
    }
  },
  "organizations": {
    "Coordenacao": {
      "mspid": "CoordenacaoMSP",
      "peers": [
        "peer0.coordenacao.ifal.local"
      ],
      "certificateAuthorities": []
    },
    "Orientador": {
      "mspid": "OrientadorMSP",
      "peers": [
        "peer0.orientador.ifal.local"
      ],
      "certificateAuthorities": []
    },
    "Aluno": {
      "mspid": "AlunoMSP",
      "peers": [
        "peer0.aluno.ifal.local"
      ],
      "certificateAuthorities": []
    }
  },
  "orderers": {
    "orderer": {
      "url": "grpcs://localhost:7050",
      "tlsCACerts": {
        "path": "organizations/ordererOrganizations/orderer.ifal.local/orderers/orderer.orderer.ifal.local/tls/ca.crt"
      },
      "grpcOptions": {
        "ssl-target-name-override": "orderer"
      }
    }
  },
  "peers": {
    "peer0.coordenacao.ifal.local": {
      "url": "grpcs://localhost:7051",
      "tlsCACerts": {
        "path": "organizations/peerOrganizations/coordenacao.ifal.local/peers/peer0.coordenacao.ifal.local/tls/ca.crt"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.coordenacao.ifal.local"
      }
    },
    "peer0.orientador.ifal.local": {
      "url": "grpcs://localhost:8051",
      "tlsCACerts": {
        "path": "organizations/peerOrganizations/orientador.ifal.local/peers/peer0.orientador.ifal.local/tls/ca.crt"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.orientador.ifal.local"
      }
    },
    "peer0.aluno.ifal.local": {
      "url": "grpcs://localhost:9051",
      "tlsCACerts": {
        "path": "organizations/peerOrganizations/aluno.ifal.local/peers/peer0.aluno.ifal.local/tls/ca.crt"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.aluno.ifal.local"
      }
    }
  }
}
EOF

echo "✅ Connection profile gerado: $OUTPUT_FILE"
echo ""
echo "IMPORTANTE: Os caminhos dos certificados TLS são relativos ao diretório 'fabric/'."
echo "Copie este arquivo para o backend e ajuste os paths conforme necessário."
