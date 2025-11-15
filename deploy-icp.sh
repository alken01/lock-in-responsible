#!/bin/bash

# Lock-In Responsible - ICP Deployment Script
# This script deploys your project to the Internet Computer

set -e  # Exit on error

echo "🚀 Starting ICP Deployment..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build Frontend
echo -e "${BLUE}📦 Building frontend...${NC}"
cd frontend
npm run build
cd ..
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 2: Deploy to Local Replica (for testing)
echo -e "${BLUE}🧪 Starting local ICP replica...${NC}"
dfx start --clean --background
echo -e "${GREEN}✓ Local replica started${NC}"
echo ""

# Step 3: Deploy Canisters
echo -e "${BLUE}🚢 Deploying canisters to local replica...${NC}"
dfx deploy
echo -e "${GREEN}✓ Canisters deployed locally${NC}"
echo ""

# Get canister IDs
BACKEND_CANISTER_ID=$(dfx canister id lock_in_backend)
FRONTEND_CANISTER_ID=$(dfx canister id lock_in_frontend)

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ LOCAL DEPLOYMENT SUCCESSFUL!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📝 Canister IDs:${NC}"
echo -e "  Backend:  ${YELLOW}$BACKEND_CANISTER_ID${NC}"
echo -e "  Frontend: ${YELLOW}$FRONTEND_CANISTER_ID${NC}"
echo ""
echo -e "${BLUE}🌐 Local URLs:${NC}"
echo -e "  Frontend: ${YELLOW}http://127.0.0.1:8000/?canisterId=$FRONTEND_CANISTER_ID${NC}"
echo -e "  Backend:  ${YELLOW}http://127.0.0.1:8000/?canisterId=$BACKEND_CANISTER_ID${NC}"
echo ""
echo -e "${BLUE}🔧 Update your frontend/.env.icp:${NC}"
echo -e "  VITE_ICP_CANISTER_ID=${YELLOW}$BACKEND_CANISTER_ID${NC}"
echo ""
echo -e "${YELLOW}⚠️  To deploy to MAINNET, run:${NC}"
echo -e "  ${BLUE}dfx deploy --network ic --with-cycles 1000000000000${NC}"
echo ""
echo -e "${BLUE}💡 Tip: Keep this terminal open or run 'dfx stop' to stop the replica${NC}"
