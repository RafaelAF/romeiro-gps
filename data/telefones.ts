export interface TelefoneUtil {
  id: string;
  nome: string;
  numero: string;
  categoria: "emergencia" | "saude" | "apoio" | "publico";
}

export const CATEGORIA_TELEFONE: Record<TelefoneUtil["categoria"], string> = {
  emergencia: "Emergência",
  saude: "Saúde",
  apoio: "Apoio ao Romeiro",
  publico: "Serviços Públicos",
};

export const TELEFONES_UTEIS: TelefoneUtil[] = [
  { id: "pm", nome: "Polícia Militar", numero: "190", categoria: "emergencia" },
  { id: "bombeiros", nome: "Corpo de Bombeiros", numero: "193", categoria: "emergencia" },
  { id: "samu", nome: "SAMU", numero: "192", categoria: "emergencia" },
  { id: "guarda", nome: "Guarda Municipal", numero: "153", categoria: "emergencia" },
  { id: "prontosocorro", nome: "Pronto Atendimento 24h / Santa Casa", numero: "(12) 3104-5555", categoria: "saude" },
  { id: "santacasa", nome: "Santa Casa de Aparecida", numero: "(12) 3104-5555", categoria: "saude" },
  { id: "secretariasaude", nome: "Secretaria de Saúde", numero: "(12) 3105-2202", categoria: "saude" },
  { id: "santuario", nome: "Santuário Nacional", numero: "0300 210 12 10", categoria: "apoio" },
  { id: "delegacia", nome: "Delegacia de Polícia", numero: "(12) 3105-2333", categoria: "publico" },
  { id: "prefeitura", nome: "Prefeitura de Aparecida", numero: "(12) 3104-4000", categoria: "publico" },
];
