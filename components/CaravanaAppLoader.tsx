"use client";

import dynamic from "next/dynamic";

const CaravanaApp = dynamic(() => import("@/components/CaravanaApp"), { ssr: false });

export default function CaravanaAppLoader() {
  return <CaravanaApp />;
}
