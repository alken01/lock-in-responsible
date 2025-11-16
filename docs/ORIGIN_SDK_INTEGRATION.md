# Origin SDK Integration Guide

**Integrating Camp Network's Origin SDK for Service IP Registration**

## Overview

This guide shows how to integrate the Origin SDK into Lock-In Responsible marketplace to register accountability services as on-chain IP assets with licensing and royalty distribution.

---

## Installation

```bash
cd frontend
npm install @campnetwork/origin viem
```

The React hooks are bundled in the main SDK (`@campnetwork/origin/react`).

---

## Setup

### 1. Get Origin Developer Account

1. Visit https://docs.campnetwork.xyz/
2. Create an Origin developer account
3. Obtain your **Client ID**

### 2. Environment Variables

Add to `frontend/.env`:

```env
VITE_ORIGIN_API=https://api.campnetwork.xyz
VITE_ORIGIN_CLIENT_ID=your_client_id_here
VITE_SUBGRAPH_URL=https://subgraph.campnetwork.xyz
VITE_BASECAMP_CHAIN_ID=123420001114
VITE_BASECAMP_RPC=https://rpc.basecamp.cloud
```

### 3. Get Testnet Tokens

You need ≥ 0.01 $CAMP on Basecamp testnet for gas:

1. Visit https://basecamp.cloud.blockscout.com/
2. Use the faucet to get testnet CAMP tokens
3. Transfer to your wallet

---

## React Integration

### 1. Wrap App with CampProvider

**File: `frontend/src/main.tsx`**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CampProvider } from '@campnetwork/origin/react';
import App from './App';

const originConfig = {
  apiUrl: import.meta.env.VITE_ORIGIN_API,
  clientId: import.meta.env.VITE_ORIGIN_CLIENT_ID,
  subgraphUrl: import.meta.env.VITE_SUBGRAPH_URL,
  chainId: Number(import.meta.env.VITE_BASECAMP_CHAIN_ID),
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CampProvider config={originConfig}>
      <App />
    </CampProvider>
  </StrictMode>
);
```

### 2. Create Origin Client Hook

**File: `frontend/src/hooks/useOriginSDK.ts`**

```typescript
import { useAuth } from '@campnetwork/origin/react';
import { useCallback } from 'react';

export interface OriginAsset {
  id: string;
  name: string;
  description: string;
  assetType: string;
  metadata: Record<string, any>;
  owner: string;
  createdAt: number;
}

export interface LicenseTerms {
  price: bigint;           // Price in wei
  duration: bigint;        // Duration in seconds (0 = perpetual)
  royaltyBps: number;      // 0-10000 (100 = 1%)
  allowRemix: boolean;
  paymentToken: string;    // Token address
}

export const useOriginSDK = () => {
  const { jwt, origin, viem, isAuthenticated } = useAuth();

  /**
   * Register a service as IP asset on Basecamp
   */
  const registerServiceAsIP = useCallback(
    async (
      serviceName: string,
      description: string,
      metadata: {
        category: string;
        webhookUrl: string;
        icpCanisterId: string;
        icpServiceId: number;
      }
    ): Promise<string> => {
      if (!origin) throw new Error('Origin SDK not initialized');

      // Register IpNFT
      const tx = await origin.registerIpNFT({
        source: 'marketplace',
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour
        metadata: {
          name: serviceName,
          description,
          assetType: 'service',
          ...metadata,
        },
        licenseTerms: {
          price: BigInt(0), // Free to register
          duration: BigInt(0), // Perpetual
          royaltyBps: 1000, // 10% royalty
          allowRemix: true,
          paymentToken: '0x0000000000000000000000000000000000000000', // Native CAMP
        },
      });

      // Wait for transaction confirmation
      const receipt = await viem.waitForTransactionReceipt({ hash: tx.hash });

      // Extract asset ID from logs
      const assetId = receipt.logs[0]?.topics[1];
      if (!assetId) throw new Error('Failed to get asset ID');

      return assetId;
    },
    [origin, viem]
  );

  /**
   * Create a derivative service (remix)
   */
  const remixService = useCallback(
    async (
      parentAssetId: string,
      newServiceName: string,
      modifications: string,
      metadata: Record<string, any>
    ): Promise<string> => {
      if (!origin) throw new Error('Origin SDK not initialized');

      const tx = await origin.registerIpNFT({
        source: 'marketplace',
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
        parentId: parentAssetId, // Link to parent
        metadata: {
          name: newServiceName,
          description: `Remix of ${parentAssetId}: ${modifications}`,
          assetType: 'service-derivative',
          parentAssetId,
          modifications,
          ...metadata,
        },
        licenseTerms: {
          price: BigInt(0),
          duration: BigInt(0),
          royaltyBps: 1000, // 10% goes to parent automatically
          allowRemix: true,
          paymentToken: '0x0000000000000000000000000000000000000000',
        },
      });

      const receipt = await viem.waitForTransactionReceipt({ hash: tx.hash });
      const assetId = receipt.logs[0]?.topics[1];
      if (!assetId) throw new Error('Failed to get asset ID');

      return assetId;
    },
    [origin, viem]
  );

  /**
   * Purchase a service license
   */
  const purchaseServiceLicense = useCallback(
    async (assetId: string, userId: string): Promise<string> => {
      if (!origin) throw new Error('Origin SDK not initialized');

      // Create license NFT (separate from IpNFT)
      // This records the user's purchase on-chain
      const tx = await origin.mintFile({
        file: new Blob([JSON.stringify({ assetId, userId, type: 'license' })], {
          type: 'application/json',
        }),
        metadata: {
          name: `License for ${assetId}`,
          description: `User ${userId} purchased license for service ${assetId}`,
          assetType: 'license',
          linkedAssetId: assetId,
          licenseHolder: userId,
        },
        licenseTerms: {
          price: BigInt(0),
          duration: BigInt(2592000), // 30 days
          royaltyBps: 0,
          allowRemix: false,
          paymentToken: '0x0000000000000000000000000000000000000000',
        },
      });

      const receipt = await viem.waitForTransactionReceipt({ hash: tx.hash });
      const licenseId = receipt.logs[0]?.topics[1];
      if (!licenseId) throw new Error('Failed to get license ID');

      return licenseId;
    },
    [origin, viem]
  );

  /**
   * Query assets by owner
   */
  const getMyAssets = useCallback(async (): Promise<OriginAsset[]> => {
    if (!origin || !viem) throw new Error('Origin SDK not initialized');

    // Use subgraph to query assets
    const address = await viem.requestAddresses();
    const response = await fetch(import.meta.env.VITE_SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetAssets($owner: String!) {
            ipNFTs(where: { owner: $owner }) {
              id
              metadata
              owner
              createdAt
            }
          }
        `,
        variables: { owner: address[0].toLowerCase() },
      }),
    });

    const { data } = await response.json();
    return data.ipNFTs.map((nft: any) => ({
      id: nft.id,
      name: nft.metadata.name,
      description: nft.metadata.description,
      assetType: nft.metadata.assetType,
      metadata: nft.metadata,
      owner: nft.owner,
      createdAt: Number(nft.createdAt),
    }));
  }, [origin, viem]);

  return {
    isAuthenticated,
    jwt,
    registerServiceAsIP,
    remixService,
    purchaseServiceLicense,
    getMyAssets,
  };
};
```

---

## Usage Examples

### 1. Developer Registers Service

**File: `frontend/src/pages/DeveloperPortal.tsx`**

```typescript
import { useOriginSDK } from '../hooks/useOriginSDK';
import { useState } from 'react';

export const RegisterServiceForm = () => {
  const { registerServiceAsIP } = useOriginSDK();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assetId = await registerServiceAsIP(
        'Instagram Blocker',
        'Blocks Instagram until you complete your daily goal',
        {
          category: 'Blocker',
          webhookUrl: 'https://my-service.com/webhook',
          icpCanisterId: 'rrkah-fqaaa-aaaaa-aaaaq-cai',
          icpServiceId: 1,
        }
      );

      console.log('Service registered with asset ID:', assetId);

      // Store assetId in ICP canister
      await icpCanister.updateService(1, { originAssetId: assetId });

      alert('Service successfully registered on Basecamp!');
    } catch (error) {
      console.error('Failed to register service:', error);
      alert('Registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading}>
        {loading ? 'Registering...' : 'Register Service as IP'}
      </button>
    </form>
  );
};
```

### 2. User Purchases Service

```typescript
import { useOriginSDK } from '../hooks/useOriginSDK';
import { icpClient } from '../lib/icp-api';

export const PurchaseServiceButton = ({ serviceId, assetId }) => {
  const { purchaseServiceLicense } = useOriginSDK();

  const handlePurchase = async () => {
    try {
      // 1. Purchase on ICP (deduct tokens)
      const success = await icpClient.purchaseService(serviceId);
      if (!success) throw new Error('ICP purchase failed');

      // 2. Record license on Basecamp
      const principal = await icpClient.getPrincipal();
      const licenseId = await purchaseServiceLicense(assetId, principal.toString());

      console.log('License ID:', licenseId);

      alert('Service purchased successfully!');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Failed to purchase service');
    }
  };

  return <button onClick={handlePurchase}>Purchase Service</button>;
};
```

### 3. Developer Remixes Service

```typescript
export const RemixServiceButton = ({ parentAssetId }) => {
  const { remixService } = useOriginSDK();

  const handleRemix = async () => {
    try {
      const newAssetId = await remixService(
        parentAssetId,
        'TikTok Blocker',
        'Changed blocked domain from Instagram to TikTok',
        {
          category: 'Blocker',
          webhookUrl: 'https://my-tiktok-blocker.com/webhook',
          blockedDomains: ['tiktok.com'],
        }
      );

      console.log('Remixed service asset ID:', newAssetId);

      // Register in ICP marketplace
      await icpCanister.registerService({
        name: 'TikTok Blocker',
        category: 'Blocker',
        originAssetId: newAssetId,
        parentAssetId,
      });

      alert('Service remixed successfully! 10% royalties will go to parent creator.');
    } catch (error) {
      console.error('Remix failed:', error);
    }
  };

  return <button onClick={handleRemix}>Remix This Service</button>;
};
```

---

## Data Flow: ICP ↔ Basecamp

```
┌──────────────────────────────────────────────────────┐
│           Developer Registers Service                │
└──────────────────────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
   ICP Canister          Basecamp (Origin SDK)
   ├─ Service ID: 1      ├─ Asset ID: 0x123abc
   ├─ Name               ├─ Name
   ├─ Webhook URL        ├─ Metadata (webhook, etc.)
   ├─ Pricing            ├─ License terms (royalty 10%)
   └─ originAssetId ─────┘
          │
          │ Cross-reference stored
          │
┌──────────────────────────────────────────────────────┐
│              User Purchases Service                  │
└──────────────────────────────────────────────────────┘
          │
          ▼
   ICP: Deduct tokens, create subscription
          │
          ▼
   Basecamp: Mint license NFT
          │
          ▼
   ICP stores license ID for verification
```

---

## Royalty Distribution (Automatic)

When a developer remixes a service:

1. **Parent Service**: Instagram Blocker (asset ID: `0x123abc`)
   - Created by Developer A
   - Royalty rate: 10%

2. **Derivative Service**: TikTok Blocker (asset ID: `0x456def`)
   - Created by Developer B
   - Parent: `0x123abc`
   - Inherits 10% royalty to parent

3. **User Purchases TikTok Blocker** for 100 tokens:
   - Developer B receives: 90 tokens
   - Developer A receives: 10 tokens (automatic via Origin SDK)
   - Platform receives: 20 tokens (handled by ICP)

---

## Testnet Deployment

### 1. Deploy to Basecamp Testnet

Your services will be registered on:
- **Network**: Basecamp Testnet
- **Chain ID**: 123420001114
- **RPC**: https://rpc.basecamp.cloud
- **Explorer**: https://basecamp.cloud.blockscout.com/

### 2. Verify Transactions

After registering a service:

```bash
# View transaction on block explorer
https://basecamp.cloud.blockscout.com/tx/{transaction_hash}

# View asset details
https://basecamp.cloud.blockscout.com/token/{asset_id}
```

---

## Demo Video Script (CAMP Track)

**2-5 minute demo showing:**

1. **Problem** (30s):
   - "Developers build productivity tools, but have no IP protection or monetization"

2. **Solution** (1m):
   - "Lock-In Marketplace + Origin SDK = IP ownership for services"
   - Show architecture diagram

3. **Demo** (2m):
   - Open Developer Portal
   - Register "Instagram Blocker" service
   - Show transaction on Basecamp explorer
   - Another dev remixes to create "TikTok Blocker"
   - Show automatic 10% royalty distribution

4. **Impact** (30s):
   - "Developers own their work, can license/remix, earn passive royalties"
   - "Users benefit from service ecosystem"

5. **Tech** (30s):
   - "Built with Origin SDK + ICP + React"
   - "Deployed on Basecamp testnet"
   - Show GitHub repo

---

## Troubleshooting

### Error: "Origin SDK not initialized"

- Ensure `CampProvider` wraps your app
- Check that `VITE_ORIGIN_CLIENT_ID` is set

### Error: "Insufficient gas"

- Get more $CAMP from faucet
- Ensure you have ≥ 0.01 CAMP

### Error: "Transaction reverted"

- Check Basecamp explorer for detailed error
- Verify license terms are valid (price ≥ 0, royaltyBps ≤ 10000)

---

## Resources

- **Origin SDK Docs**: https://docs.campnetwork.xyz/origin-v1/origin-sdk
- **Getting Started**: https://docs.campnetwork.xyz/origin-v1/getting-started
- **Basecamp Explorer**: https://basecamp.cloud.blockscout.com/
- **Network Info**: https://docs.campnetwork.xyz/building-on-camp/network-information
- **Starter Templates**: https://campaignlabs.notion.site/Origin-starter-page-23ff70f4732880e29fe5e97276499060

---

## Next Steps

1. ✅ Install Origin SDK
2. ✅ Configure environment
3. ✅ Wrap app with CampProvider
4. ✅ Create useOriginSDK hook
5. → Implement service registration flow
6. → Test on Basecamp testnet
7. → Record demo video
8. → Submit to CAMP track!
