
import { PlusCodes } from "olc-plus-codes";

import { ApiError } from "../../shared/http/api-error.js";

interface NominatimResponse {
    lat: string;
    lon: string;
    address?: {
      road?: string;
      residential?: string;
      pedestrian?: string;
      highway?: string;
      house_number?: string;
      postcode?: string;
      neighbourhood?: string;
      suburb?: string;
      quarter?: string;
      city_district?: string;
      city?: string;
      town?: string;
      village?: string;
      municipality?: string;
      county?: string;
      state?: string;
      country_code?: string;
      "ISO3166-2-lvl4"?: string;
      [key: string]: string | undefined;
    };
  }
  
  export interface ReverseGeocodingResult {
    city: string;
    state: string;
    country: string;
    plusCode: string;
    zipCode: string | null;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
  }

const plusCodes = new PlusCodes();

const stateCodes: Record<string, string> = {
  Acre: "AC",
  Alagoas: "AL",
  Amapá: "AP",
  Amazonas: "AM",
  Bahia: "BA",
  Ceará: "CE",
  "Distrito Federal": "DF",
  "Espírito Santo": "ES",
  Goiás: "GO",
  Maranhão: "MA",
  "Mato Grosso": "MT",
  "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG",
  Pará: "PA",
  Paraíba: "PB",
  Paraná: "PR",
  Pernambuco: "PE",
  Piauí: "PI",
  "Rio de Janeiro": "RJ",
  "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS",
  Rondônia: "RO",
  Roraima: "RR",
  "Santa Catarina": "SC",
  "São Paulo": "SP",
  Sergipe: "SE",
  Tocantins: "TO",
};

const cache = new Map<string, ReverseGeocodingResult>();

let lastRequestAt = 0;
let requestQueue = Promise.resolve();

async function waitForRequestSlot() {
  const nextRequest = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestAt;
    const waitTime = Math.max(0, 1100 - elapsed);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    lastRequestAt = Date.now();
  });

  requestQueue = nextRequest.catch(() => undefined);

  await nextRequest;
}

export class GeocodingService {
  async reverse(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodingResult> {
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;

    const cached = cache.get(cacheKey);

    if (cached) return cached;

    const contactEmail = process.env.GEOCODING_CONTACT_EMAIL;

    if (!contactEmail) {
      throw new ApiError(
        "Configure o contato do serviço de geocodificação.",
        500,
        "GEOCODING_CONTACT_MISSING",
      );
    }

    await waitForRequestSlot();

    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "jsonv2",
      addressdetails: "1",
      "accept-language": "pt-BR",
      zoom: "10",
    });

    let response: Response;

    try {
      response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          headers: {
            "User-Agent": `MEGA-Plataforma/1.0 (${contactEmail})`,
            "Accept-Language": "pt-BR",
          },
          signal: AbortSignal.timeout(10000),
        },
      );
    } catch {
      throw new ApiError(
        "Não foi possível consultar a localização agora.",
        502,
        "GEOCODING_PROVIDER_UNAVAILABLE",
      );
    }

    if (!response.ok) {
      throw new ApiError(
        "O serviço de localização não respondeu corretamente.",
        502,
        "GEOCODING_PROVIDER_ERROR",
      );
    }

    const result = (await response.json()) as NominatimResponse;
    const address = result.address;

    if (!address || address.country_code?.toLowerCase() !== "br") {
      throw new ApiError(
        "Não encontramos uma localização válida no Brasil.",
        404,
        "GEOCODING_NOT_FOUND",
      );
    }

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county;

    const stateCode = address["ISO3166-2-lvl4"]?.match(/^BR-([A-Z]{2})$/)?.[1];

    const state = stateCode || stateCodes[address.state ?? ""];

    if (!city || !state) {
      throw new ApiError(
        "Não foi possível identificar a cidade e o estado.",
        404,
        "GEOCODING_ADDRESS_INCOMPLETE",
      );
    }

    const referenceLatitude = Number(result.lat);
    const referenceLongitude = Number(result.lon);

    const fullCode = plusCodes.encode(latitude, longitude, 10);

    const plusCode = plusCodes.shorten(
      fullCode,
      referenceLatitude,
      referenceLongitude,
    );

    const normalizedResult: ReverseGeocodingResult = {
        city,
        state,
        country: "Brasil",
        plusCode,
      
        zipCode: address.postcode ?? null,
      
        street:
          address.road ||
          address.residential ||
          address.pedestrian ||
          address.highway ||
          null,
      
        number: address.house_number ?? null,
      
        neighborhood:
          address.neighbourhood ||
          address.suburb ||
          address.quarter ||
          address.city_district ||
          null,
      };

    cache.set(cacheKey, normalizedResult);

    return normalizedResult;
  }
}
