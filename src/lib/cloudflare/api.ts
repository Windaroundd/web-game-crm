// Cloudflare API integration utilities
// Implements all four purge modes as specified in req.md

export interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  account: {
    id: string;
    name: string;
  };
}

export interface CloudflarePurgeRequest {
  accountId: string;
  apiToken: string;
  zoneId: string;
  mode: "url" | "hostname" | "tag" | "prefix";
  payload: string[];
  exclusions?: string[];
}

export interface CloudflarePurgeResponse {
  success: boolean;
  errors: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  result?: {
    id: string;
  };
}

export interface CloudflareAPIError {
  code: number;
  message: string;
  error_chain?: CloudflareAPIError[];
}

// Cloudflare API client class
export class CloudflareAPI {
  private baseURL = "https://api.cloudflare.com/client/v4";

  constructor(private apiToken: string) {
    if (!apiToken) {
      throw new Error("API token is required");
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.apiToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Cloudflare API error (${response.status}): ${
          errorData.errors?.[0]?.message || response.statusText
        }`
      );
    }

    return response.json();
  }

  // Get zones for an account
  async getZones(accountId?: string): Promise<CloudflareZone[]> {
    let endpoint = "/zones";
    if (accountId) {
      endpoint += `?account.id=${accountId}`;
    }

    const response = await this.makeRequest<{
      result: CloudflareZone[];
      success: boolean;
    }>(endpoint);

    if (!response.success) {
      throw new Error("Failed to fetch zones");
    }

    return response.result;
  }

  // Verify API token and get account info
  async verifyToken(): Promise<{
    id: string;
    email: string;
    status: string;
  }> {
    const response = await this.makeRequest<{
      result: {
        id: string;
        email: string;
        status: string;
      };
      success: boolean;
    }>("/user/tokens/verify");

    if (!response.success) {
      throw new Error("Invalid API token");
    }

    return response.result;
  }

  // Purge cache with all four modes supported
  async purgeCache(request: Omit<CloudflarePurgeRequest, 'apiToken' | 'accountId'>): Promise<CloudflarePurgeResponse> {
    const { zoneId, mode, payload, exclusions } = request;

    // Validate inputs
    if (!zoneId) {
      throw new Error("Zone ID is required");
    }

    if (!payload || payload.length === 0) {
      throw new Error("Payload is required and cannot be empty");
    }

    // Build Cloudflare API payload based on mode
    let cloudflarePayload: Record<string, string[]> = {};

    switch (mode) {
      case "url":
        // Apply exclusions for URL mode
        let files = payload;
        if (exclusions && exclusions.length > 0) {
          files = payload.filter(file => !exclusions.includes(file));
        }

        if (files.length === 0) {
          throw new Error("No files to purge after applying exclusions");
        }

        cloudflarePayload = { files };
        break;

      case "hostname":
        cloudflarePayload = { hosts: payload };
        break;

      case "tag":
        cloudflarePayload = { tags: payload };
        break;

      case "prefix":
        cloudflarePayload = { prefixes: payload };
        break;

      default:
        throw new Error(`Unsupported purge mode: ${mode}`);
    }

    try {
      const response = await this.makeRequest<CloudflarePurgeResponse>(
        `/zones/${zoneId}/purge_cache`,
        {
          method: "POST",
          body: JSON.stringify(cloudflarePayload),
        }
      );

      return response;
    } catch (error) {
      // Re-throw with more context
      throw new Error(
        `Cache purge failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Test connection to a specific zone
  async testConnection(zoneId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest<{
        result: { id: string; name: string };
        success: boolean;
      }>(`/zones/${zoneId}`);

      return response.success;
    } catch {
      return false;
    }
  }
}

// Utility functions for common operations

export function validatePurgePayload(mode: string, payload: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload || payload.length === 0) {
    errors.push("Payload cannot be empty");
    return { valid: false, errors };
  }

  switch (mode) {
    case "url":
      payload.forEach((url, index) => {
        try {
          new URL(url);
        } catch {
          errors.push(`Invalid URL at position ${index + 1}: ${url}`);
        }
      });
      break;

    case "hostname":
      payload.forEach((hostname, index) => {
        if (!hostname.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
          errors.push(`Invalid hostname at position ${index + 1}: ${hostname}`);
        }
      });
      break;

    case "tag":
      payload.forEach((tag, index) => {
        if (!tag.trim() || tag.length > 50) {
          errors.push(`Invalid tag at position ${index + 1}: ${tag} (must be 1-50 characters)`);
        }
      });
      break;

    case "prefix":
      payload.forEach((prefix, index) => {
        try {
          new URL(prefix);
        } catch {
          errors.push(`Invalid URL prefix at position ${index + 1}: ${prefix}`);
        }
      });
      break;

    default:
      errors.push(`Unsupported purge mode: ${mode}`);
  }

  return { valid: errors.length === 0, errors };
}

// Get zone ID from domain name
export async function getZoneIdByDomain(apiToken: string, domain: string): Promise<string | null> {
  try {
    const api = new CloudflareAPI(apiToken);
    const zones = await api.getZones();

    // Find zone that matches the domain or is a parent domain
    const zone = zones.find(z =>
      z.name === domain || domain.endsWith(`.${z.name}`)
    );

    return zone?.id || null;
  } catch {
    return null;
  }
}

// Rate limiting helper for API calls
export class CloudflareRateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 1200, windowMs = 300000) { // 1200 requests per 5 minutes (Cloudflare limit)
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();

    // Remove requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }

    this.requests.push(now);
    return true;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;

    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}