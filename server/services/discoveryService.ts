export interface SearchQueryInput {
  rawText?: string;
  role?: string;
  industry?: string;
  stage?: string;
  location?: string;
}

export interface ParsedQueryFilters {
  locations: string[];
  industries: string[];
  roles: string[];
  capabilities: string[];
  keywords: string[];
}

export interface MatchResultItem {
  profile: any;
  isMatch: boolean;
  matchReasons: string[];
  groundedAttributes: string[];
}

export interface DiscoveryProvider {
  parseQuery(query: SearchQueryInput): ParsedQueryFilters;
  generateMatchReasons(profile: any, parsed: ParsedQueryFilters, rawText?: string): { reasons: string[]; sources: string[] };
}

/**
 * Deterministic MVP Discovery Provider
 * Can be swapped with an LLM/Embedding Vector Search Provider without modifying consumer routes.
 */
export class DeterministicDiscoveryProvider implements DiscoveryProvider {
  parseQuery(query: SearchQueryInput): ParsedQueryFilters {
    const raw = (query.rawText || '').toLowerCase().trim();
    const keywords = raw.split(/\s+/).filter((k) => k.length > 2);

    const locations: string[] = [];
    const industries: string[] = [];
    const roles: string[] = [];
    const capabilities: string[] = [];

    if (query.location) locations.push(query.location.toLowerCase());
    if (query.industry) industries.push(query.industry.toLowerCase());
    if (query.role) roles.push(query.role.toLowerCase());

    // Deterministic Intent Parser Rules
    if (raw.includes('uae') || raw.includes('dubai') || raw.includes('middle east') || raw.includes('gcc')) {
      locations.push('dubai', 'uae', 'gcc', 'singapore');
    }
    if (raw.includes('manufacturing') || raw.includes('electronics') || raw.includes('supply chain')) {
      industries.push('manufacturing', 'electronics', 'hardware', 'supply chain');
    }
    if (raw.includes('cfo') || raw.includes('finance') || raw.includes('series b') || raw.includes('debt')) {
      roles.push('cfo', 'chief financial officer', 'finance');
      capabilities.push('finance', 'venture debt', 'fundraising');
    }
    if (raw.includes('expansion') || raw.includes('international')) {
      capabilities.push('international expansion', 'expansion');
    }
    if (raw.includes('hiring') || raw.includes('talent')) {
      capabilities.push('hiring', 'executive talent');
    }

    return {
      locations,
      industries,
      roles,
      capabilities,
      keywords
    };
  }

  generateMatchReasons(
    profile: any,
    parsed: ParsedQueryFilters,
    rawText?: string
  ): { reasons: string[]; sources: string[] } {
    const reasons: string[] = [];
    const sources: string[] = [];

    const locLower = (profile.location || '').toLowerCase();
    const indLower = (profile.industry || '').toLowerCase();
    const roleLower = (profile.role || '').toLowerCase();
    const compLower = (profile.company || '').toLowerCase();
    const helpLower = (profile.canHelpWithJson || '').toLowerCase();

    // Grounded Reason 1: Location
    if (parsed.locations.some((l) => locLower.includes(l))) {
      reasons.push(`Based in ${profile.location}`);
      sources.push('Profile.location');
    }

    // Grounded Reason 2: Role & Company
    if (parsed.roles.some((r) => roleLower.includes(r))) {
      reasons.push(`Verified ${profile.role} at ${profile.company}`);
      sources.push('Profile.role');
    }

    // Grounded Reason 3: Industry
    if (parsed.industries.some((i) => indLower.includes(i))) {
      reasons.push(`Industry match: ${profile.industry}`);
      sources.push('Profile.industry');
    }

    // Grounded Reason 4: Capabilities
    if (parsed.capabilities.some((c) => helpLower.includes(c))) {
      let capStr = 'Capability Match';
      try {
        const arr = JSON.parse(profile.canHelpWithJson);
        if (Array.isArray(arr) && arr.length > 0) capStr = arr[0];
      } catch (e) {}
      reasons.push(`Offers: ${capStr}`);
      sources.push('Profile.canHelpWithJson');
    }

    // Fallback if broad query matching company or bio
    if (rawText && reasons.length === 0) {
      const qLower = rawText.toLowerCase();
      if (locLower.includes(qLower)) {
        reasons.push(`Based in ${profile.location}`);
        sources.push('Profile.location');
      } else if (indLower.includes(qLower)) {
        reasons.push(`Industry match: ${profile.industry}`);
        sources.push('Profile.industry');
      } else if (compLower.includes(qLower) || roleLower.includes(qLower)) {
        reasons.push(`Verified ${profile.role} at ${profile.company}`);
        sources.push('Profile.role');
      }
    }

    // Default grounded baseline if still empty
    if (reasons.length === 0) {
      reasons.push(`Verified ${profile.role} at ${profile.company}`);
      sources.push('Profile.role');
      reasons.push(`Based in ${profile.location}`);
      sources.push('Profile.location');
    }

    return { reasons, sources };
  }
}

export const discoveryService = new DeterministicDiscoveryProvider();
