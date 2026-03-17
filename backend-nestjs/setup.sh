#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   North Wollo Tourism - NestJS Backend Setup Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Node.js
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 20 LTS from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Check npm
echo -e "${YELLOW}Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm ${NPM_VERSION} found${NC}"
echo ""

# Check PostgreSQL
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL client not found (optional if using remote database)${NC}"
else
    echo -e "${GREEN}✓ PostgreSQL client found${NC}"
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

echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "  1. Start the development server:"
echo -e "     ${YELLOW}npm run start:dev${NC}"
echo ""
echo -e "  2. Open Swagger UI in your browser:"
echo -e "     ${YELLOW}http://localhost:3001/api/docs${NC}"
echo ""
echo -e "  3. Login with default credentials:"
echo -e "     Username: ${YELLOW}admin${NC}"
echo -e "     Password: ${YELLOW}admin123456${NC}"
echo ""
echo -e "  4. Update frontend API URL:"
echo -e "     ${YELLOW}NEXT_PUBLIC_API_URL=http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo ""
echo -e "  ${YELLOW}npm run start:dev${NC}        - Start development server"
echo -e "  ${YELLOW}npm run build${NC}            - Build for production"
echo -e "  ${YELLOW}npm run start:prod${NC}       - Start production server"
echo -e "  ${YELLOW}npm run prisma:studio${NC}    - Open Prisma Studio"
echo -e "  ${YELLOW}npm run lint${NC}             - Run ESLint"
echo -e "  ${YELLOW}npm run format${NC}           - Format code with Prettier"
echo -e "  ${YELLOW}npm run test${NC}             - Run tests"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo ""
echo -e "  - README.md: Backend documentation"
echo -e "  - QUICK_START.md: Quick start guide"
echo -e "  - MIGRATION_GUIDE.md: Detailed migration guide"
echo ""
