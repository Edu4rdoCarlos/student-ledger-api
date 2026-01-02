#!/bin/bash
# Script para exportar certificados Admin para o backend

set -e

FABRIC_DIR="${FABRIC_DIR:-/Users/dudu/Documents/Faculdade/TCC/Projeto/student-ledger/fabric}"
OUTPUT_DIR="${1:-./backend-certs}"

echo "Exportando certificados Admin..."
echo "Diretório de saída: $OUTPUT_DIR"
echo ""

# Criar estrutura de diretórios
mkdir -p "$OUTPUT_DIR/coordenacao"
mkdir -p "$OUTPUT_DIR/orientador"
mkdir -p "$OUTPUT_DIR/aluno"

# Função para copiar certificados de uma organização
copy_admin_certs() {
  local org=$1
  local org_lower=$(echo "$org" | tr '[:upper:]' '[:lower:]')
  local org_dir="$FABRIC_DIR/organizations/peerOrganizations/${org_lower}.ifal.local"

  echo "📁 Copiando certificados de $org..."

  # Certificado
  cp "$org_dir/users/Admin@${org_lower}.ifal.local/msp/signcerts/"*.pem \
     "$OUTPUT_DIR/$org_lower/cert.pem"

  # Chave privada
  cp "$org_dir/users/Admin@${org_lower}.ifal.local/msp/keystore/"* \
     "$OUTPUT_DIR/$org_lower/key.pem"

  # CA cert (para validação)
  cp "$org_dir/msp/cacerts/"*.pem \
     "$OUTPUT_DIR/$org_lower/ca.crt"

  echo "   ✅ cert.pem"
  echo "   ✅ key.pem"
  echo "   ✅ ca.crt"
  echo ""
}

# Copiar certificados das 3 organizações
copy_admin_certs "Coordenacao"
copy_admin_certs "Orientador"
copy_admin_certs "Aluno"

# Copiar também o TLS CA do orderer (para conexão)
echo "📁 Copiando TLS CA do Orderer..."
mkdir -p "$OUTPUT_DIR/orderer"
cp "$FABRIC_DIR/organizations/ordererOrganizations/orderer.ifal.local/orderers/orderer.orderer.ifal.local/tls/ca.crt" \
   "$OUTPUT_DIR/orderer/tls-ca.crt"
echo "   ✅ tls-ca.crt"
echo ""

# Copiar TLS CA dos peers
echo "📁 Copiando TLS CA dos Peers..."
for org in coordenacao orientador aluno; do
  cp "$FABRIC_DIR/organizations/peerOrganizations/${org}.ifal.local/peers/peer0.${org}.ifal.local/tls/ca.crt" \
     "$OUTPUT_DIR/$org/tls-ca.crt"
  echo "   ✅ $org/tls-ca.crt"
done

echo ""
echo "✅ Certificados exportados com sucesso!"
echo ""
echo "Estrutura criada:"
tree "$OUTPUT_DIR" 2>/dev/null || find "$OUTPUT_DIR" -type f
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Copie a pasta '$OUTPUT_DIR' para o projeto backend"
echo "2. Configure as variáveis de ambiente no backend (.env)"
echo "3. Use o Fabric SDK para conectar (exemplo em fabric-client.ts)"
