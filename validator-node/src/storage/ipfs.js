import axios from 'axios';
import { create } from 'ipfs-http-client';
import { logger } from '../utils/logger.js';

/**
 * IPFS Client - Handles fetching and uploading data to IPFS
 */
export class IPFSClient {
  constructor(gateway = 'https://ipfs.io') {
    this.gateway = gateway;

    // For uploading (use local IPFS node or web3.storage/pinata)
    this.uploadClient = null;

    // Check if local IPFS node is available
    this._initializeUploadClient();
  }

  /**
   * Initialize upload client
   */
  async _initializeUploadClient() {
    try {
      // Try to connect to local IPFS node
      this.uploadClient = create({
        host: 'localhost',
        port: 5001,
        protocol: 'http',
      });

      // Test connection
      await this.uploadClient.id();
      logger.info('✅ Local IPFS node connected');
    } catch (error) {
      logger.warn('⚠️  Local IPFS node not available, will use web service for uploads');
      this.uploadClient = null;
    }
  }

  /**
   * Fetch JSON from IPFS
   */
  async fetchJson(ipfsHash) {
    try {
      const url = this._buildGatewayUrl(ipfsHash);
      logger.info(`   Fetching from IPFS: ${url}`);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch from IPFS: ${ipfsHash}`, error.message);

      // Try alternative gateways
      const altGateways = [
        'https://ipfs.io',
        'https://cloudflare-ipfs.com',
        'https://gateway.pinata.cloud',
      ];

      for (const gateway of altGateways) {
        if (gateway === this.gateway) continue;

        try {
          const url = `${gateway}/ipfs/${ipfsHash}`;
          logger.info(`   Trying alternative gateway: ${url}`);

          const response = await axios.get(url, {
            timeout: 30000,
            headers: {
              'Accept': 'application/json',
            },
          });

          logger.info(`   ✅ Retrieved from ${gateway}`);
          return response.data;
        } catch (altError) {
          continue;
        }
      }

      throw new Error(`Failed to fetch ${ipfsHash} from all gateways`);
    }
  }

  /**
   * Fetch file (image, etc.) from IPFS
   */
  async fetchFile(ipfsHash) {
    try {
      const url = this._buildGatewayUrl(ipfsHash);
      logger.info(`   Fetching file from IPFS: ${url}`);

      const response = await axios.get(url, {
        timeout: 60000,
        responseType: 'arraybuffer',
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch file from IPFS: ${ipfsHash}`, error.message);
      throw error;
    }
  }

  /**
   * Upload JSON to IPFS
   */
  async uploadJson(data) {
    try {
      if (this.uploadClient) {
        // Use local IPFS node
        const content = JSON.stringify(data, null, 2);
        const { cid } = await this.uploadClient.add(content);
        const hash = cid.toString();

        logger.info(`   ✅ Uploaded to IPFS: ${hash}`);
        return hash;

      } else {
        // Use web service (web3.storage or pinata)
        // For hackathon, you can use a simple pinning service

        // Option 1: Use web3.storage
        if (process.env.WEB3_STORAGE_TOKEN) {
          return await this._uploadToWeb3Storage(data);
        }

        // Option 2: Use Pinata
        if (process.env.PINATA_JWT) {
          return await this._uploadToPinata(data);
        }

        // Fallback: Just return a mock hash for local testing
        logger.warn('⚠️  No IPFS upload service configured, using mock hash');
        const mockHash = `Qm${Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 44)}`;
        return mockHash;
      }
    } catch (error) {
      logger.error('Failed to upload to IPFS:', error.message);
      throw error;
    }
  }

  /**
   * Upload file to IPFS
   */
  async uploadFile(buffer, filename) {
    try {
      if (this.uploadClient) {
        const { cid } = await this.uploadClient.add({
          path: filename,
          content: buffer,
        });
        const hash = cid.toString();

        logger.info(`   ✅ Uploaded file to IPFS: ${hash}`);
        return hash;

      } else {
        // Use web service
        if (process.env.WEB3_STORAGE_TOKEN) {
          return await this._uploadFileToWeb3Storage(buffer, filename);
        }

        if (process.env.PINATA_JWT) {
          return await this._uploadFileToPinata(buffer, filename);
        }

        throw new Error('No IPFS upload service configured');
      }
    } catch (error) {
      logger.error('Failed to upload file to IPFS:', error.message);
      throw error;
    }
  }

  /**
   * Upload to web3.storage
   */
  async _uploadToWeb3Storage(data) {
    try {
      const response = await axios.post(
        'https://api.web3.storage/upload',
        JSON.stringify(data),
        {
          headers: {
            'Authorization': `Bearer ${process.env.WEB3_STORAGE_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.cid;
    } catch (error) {
      logger.error('web3.storage upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload to Pinata
   */
  async _uploadToPinata(data) {
    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: data,
          pinataMetadata: {
            name: `validation-${Date.now()}.json`,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      logger.error('Pinata upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Build gateway URL
   */
  _buildGatewayUrl(ipfsHash) {
    // Remove ipfs:// prefix if present
    const hash = ipfsHash.replace(/^ipfs:\/\//, '');

    return `${this.gateway}/ipfs/${hash}`;
  }

  /**
   * Check if IPFS hash is valid
   */
  isValidHash(hash) {
    // Simple validation for CIDv0 and CIDv1
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}/.test(hash);
  }
}
