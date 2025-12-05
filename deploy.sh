#!/bin/bash

# Script de deploy automatizado para Sueldos México con SSG
# Uso: ./deploy.sh

set -e  # Exit on error

echo "🚀 Iniciando deploy de Sueldos México con SSG..."
echo ""

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración (AJUSTA ESTOS VALORES)
SERVER_USER="tu-usuario"
SERVER_HOST="tu-servidor.com"
SERVER_PATH="/var/www/sueldosmexico"

echo -e "${BLUE}📦 Paso 1: Build con SSG${NC}"
npm run build:ssg

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en el build${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build completado${NC}"
echo ""

echo -e "${BLUE}📊 Verificando páginas generadas...${NC}"
PAGE_COUNT=$(find dist -name "index.html" | wc -l)
echo -e "${GREEN}✅ ${PAGE_COUNT} páginas HTML generadas${NC}"
echo ""

echo -e "${BLUE}📤 Paso 2: Subiendo archivos al servidor${NC}"
echo "Servidor: ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"
echo ""

# Usar rsync para copiar solo lo que cambió
rsync -avz --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --progress \
    dist/ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al subir archivos${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Archivos subidos exitosamente${NC}"
echo ""

echo -e "${BLUE}🔄 Paso 3: Reiniciando NGINX (opcional)${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "sudo systemctl reload nginx"

if [ $? -ne 0 ]; then
    echo -e "${RED}⚠️  No se pudo recargar NGINX (puede requerir permisos)${NC}"
else
    echo -e "${GREEN}✅ NGINX recargado${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deploy completado exitosamente${NC}"
echo ""
echo "📊 Estadísticas:"
echo "   - Páginas generadas: ${PAGE_COUNT}"
echo "   - Servidor: https://${SERVER_HOST}"
echo ""
echo "🔍 Próximos pasos:"
echo "   1. Verifica que el sitio cargue: https://${SERVER_HOST}"
echo "   2. Prueba una página SEO: https://${SERVER_HOST}/cuanto-gana/maestro"
echo "   3. Verifica el sitemap: https://${SERVER_HOST}/sitemap.xml"
echo "   4. Envía el sitemap a Google Search Console"
echo ""
