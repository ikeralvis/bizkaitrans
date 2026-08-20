import { parseLooseJson } from "../shared/looseJson";

const BASE = "https://apli.bizkaia.net/APPS/DANOK/TQWS/TQ.ASMX";

interface BizkaibusWrapperResponse {
  STATUS: string;
  Resultado: string;
  Error?: string;
}

/**
 * Raw wrapper for a stop's real-time board: STATUS/Error plus a `Resultado`
 * field holding an XML string (<GetPasoParadaResult>...</GetPasoParadaResult>).
 * Parsing that XML is the caller's job (see normalize.ts) - this layer only
 * talks HTTP.
 */
export async function getStopArrivalsRaw(reducedCode: string): Promise<BizkaibusWrapperResponse> {
  const url = `${BASE}/GetPasoParadaMobile_JSON?callback=&strLinea=&strParada=${encodeURIComponent(reducedCode)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Bizkaibus getStopArrivals(${reducedCode}) failed: ${res.status}`);
  const text = await res.text();
  const data = parseLooseJson<BizkaibusWrapperResponse>(text);
  if (data.STATUS !== "OK") throw new Error(data.Error || "Bizkaibus API error");
  return data;
}
