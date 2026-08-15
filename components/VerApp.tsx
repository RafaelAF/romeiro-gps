"use client";

import dynamic from "next/dynamic";

const VerMapa = dynamic(() => import("@/components/VerMapa"), { ssr: false });

export interface VerAppProps {
  lat: number;
  lng: number;
  rotulo: string;
}

export default function VerApp(props: VerAppProps) {
  return <VerMapa {...props} />;
}
