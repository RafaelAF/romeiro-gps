import type { Metadata } from "next";
import CaravanaAppLoader from "@/components/CaravanaAppLoader";
import SeoHome from "@/components/SeoHome";

export const metadata: Metadata = {
  title: "Mapa de Aparecida - SP com pontos de interesse e ponto de encontro",
  description:
    "Abra o mapa de Aparecida - SP: encontre o Santuário Nacional, pontos de turismo religioso, apoio ao romeiro e mais, e compartilhe um ponto de encontro por link temporário.",
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <>
      <CaravanaAppLoader />
      <SeoHome />
    </>
  );
}
