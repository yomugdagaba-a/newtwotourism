#!/bin/bash

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   North Wollo Tourism - Complete Setup (HTTPS + PostgreSQL)║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 20 LTS from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Check npm
echo -e "${YELLOW}Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm ${NPM_VERSION} found${NC}"
echo ""

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL not found in PATH${NC}"
    echo "Make sure PostgreSQL is installed and running"
    echo "You can still continue with the setup"
else
    PG_VERSION=$(psql --version)
    echo -e "${GREEN}✓ ${PG_VERSION} found${NC}"
fi
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check if .env exists
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please update .env with your database credentials${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi
echo ""

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to generate Prisma client${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prisma client generated${NC}"
echo ""

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run prisma:migrate
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to run migrations${NC}"
    echo -e "${YELLOW}Make sure PostgreSQL is running and DATABASE_URL is correct in .env${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# Seed database
echo -e "${YELLOW}Seeding database with initial data...${NC}"
npm run prisma:seed
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to seed database${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Database seeded${NC}"
echo ""

# Success message
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup Completed Successfully! 🎉              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Configuration Summary:${NC}"
echo ""
echo -e "  Backend Port:     ${YELLOW}8080 (HTTPS)${NC}"
echo -e "  Frontend Port:    ${YELLOW}3000 (HTTPS)${NC}"
echo -e "  Database:        ${YELLOW}PostgreSQL on localhost:5432${NC}"
echo -e "  Node.js:         ${YELLOW}${NODE_VERSION}${NC}"
echo ""

echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  Option 1: Run in IntelliJ IDEA (Recommended)"
echo "    1. Open IntelliJ IDEA"
echo "    2. File → Open → Select backend-nestjs folder"
echo "    3. Configure Node.js interpreter"
echo "    4. Run → Edit Configurations → Add npm script 'start:dev'"
echo "    5. Click Run button"
echo ""
echo "  Option 2: Run in Terminal"
echo -e "    ${YELLOW}npm run start:dev${NC}"
echo ""
echo "  Then in another terminal:"
echo -e "    ${YELLOW}cd ../frontend${NC}"
echo -e "    ${YELLOW}npm install${NC}"
echo -e "    ${YELLOW}npm run dev${NC}"
echo ""

echo -e "${BLUE}Access URLs:${NC}"
echo ""
echo -e "  Frontend:        ${YELLOW}https://localhost:3000${NC}"
echo -e "  API Docs:        ${YELLOW}https://localhost:8080/api/docs${NC}"
echo -e "  Prisma Studio:   ${YELLOW}http://localhost:5555${NC}"
echo ""

echo -e "${BLUE}Default Credentials:${NC}"
echo ""
echo "  Admin:"
echo -e "    Username: ${YELLOW}admin${NC}"
echo -e "    Password: ${YELLOW}admin123456${NC}"
echo ""
echo "  Client:"
echo -e "    Username: ${YELLOW}client${NC}"
echo -e "    Password: ${YELLOW}client123456${NC}"
echo ""
echo "  Hotel Owner:"
echo -e "    Username: ${YELLOW}hotelowner${NC}"
echo -e "    Password: ${YELLOW}owner123456${NC}"
echo ""

echo -e "${BLUE}Useful Commands:${NC}"
echo ""
echo -e "  ${YELLOW}npm run start:dev${NC}        - Start development server"
echo -e "  ${YELLOW}npm run start:debug${NC}      - Start with debugging"
echo -e "  ${YELLOW}npm run build${NC}            - Build for production"
echo -e "  ${YELLOW}npm run start:prod${NC}       - Start production server"
echo -e "  ${YELLOW}npm run prisma:studio${NC}    - Open Prisma Studio"
echo -e "  ${YELLOW}npm run lint${NC}             - Run ESLint"
echo -e "  ${YELLOW}npm run format${NC}           - Format code with Prettier"
echo -e "  ${YELLOW}npm run test${NC}             - Run tests"
echo ""

echo -e "${BLUE}Documentation:${NC}"
echo ""
echo "  - SETUP_HTTPS_POSTGRESQL.md: Complete setup guide"
echo "  - INTELLIJ_SETUP.md: IntelliJ IDEA setup guide"
echo "  - HOW_TO_RUN.md: How to run the project"
echo "  - QUICK_REFERENCE.md: Quick command reference"
echo ""

