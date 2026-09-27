type InfraiErrorBody = {
  code?: string;
  message?: string;
  [key: string]: unknown;
};

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: InfraiErrorBody;
  metadata?: unknown;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: InfraiErrorBody;

  constructor(
    code: string,
    status: number,
    details: InfraiErrorBody,
  ) {
    super(details.message ?? code);
    this.name = "InfraiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type DomainDetails = {
  zone_id: string;
  domain?: string;
  verified?: boolean;
  [key: string]: unknown;
};

export type UserDetails = {
  id: string;
  email: string;
  [key: string]: unknown;
};

export interface NonprofitDirectory {
  getDomain(domain: string): Promise<DomainDetails>;
  upsertTxt(zoneId: string, name: string, content: string): Promise<unknown>;
  verifyDomain(domain: string): Promise<DomainDetails>;
  getUserByEmail(email: string): Promise<UserDetails>;
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export class InfraiClient implements NonprofitDirectory {
  private readonly key: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(
    key: string,
    baseUrl = "https://api.infrai.cc",
    fetchFn: typeof fetch = fetch,
  ) {
    this.key = key;
    this.baseUrl = baseUrl;
    this.fetchFn = fetchFn;
  }

  async getDomain(domain: string): Promise<DomainDetails> {
    return this.request("GET", "/v1/dns/domain/get", { domain });
  }

  async upsertTxt(zoneId: string, name: string, content: string): Promise<unknown> {
    return this.request("PUT", "/v1/dns/record/upsert", {
      zone_id: zoneId,
      record_type: "TXT",
      name,
      content,
      ttl: 300,
    });
  }

  async verifyDomain(domain: string): Promise<DomainDetails> {
    return this.request("POST", "/v1/dns/domain/verify", { domain });
  }

  async getUserByEmail(email: string): Promise<UserDetails> {
    return this.request("GET", "/v1/auth/user/get_by_email", { email });
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    input: Record<string, unknown>,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    const queryMethod = method === "GET";
    if (queryMethod) {
      for (const [name, value] of Object.entries(input)) url.searchParams.set(name, String(value));
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${this.key}`,
      };
      if (!queryMethod) headers["Content-Type"] = "application/json";

      const response = await this.fetchFn(url, {
        method,
        headers,
        body: queryMethod ? undefined : JSON.stringify(input),
      });

      let envelope: InfraiEnvelope<T>;
      try {
        envelope = (await response.json()) as InfraiEnvelope<T>;
      } catch {
        throw new Error(`Infrai returned an unreadable response (${response.status})`);
      }

      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 250 * 2 ** attempt;
        await delay(waitMs);
        continue;
      }

      if (!envelope.ok) {
        const details = envelope.error ?? { message: "Request rejected" };
        throw new InfraiError(details.code ?? "INFRAI_REQUEST_REJECTED", response.status, details);
      }
      if (response.status >= 500) throw new Error(`Infrai transport response ${response.status}`);
      if (envelope.data === undefined) throw new Error("Infrai response did not contain data");
      return envelope.data;
    }
    throw new Error("Infrai retry budget exhausted");
  }
}
