"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BotaoVoltar() {
  const router = useRouter();

  const voltar = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <button
      type="button"
      onClick={voltar}
      className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-sm active:scale-[.98]"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </button>
  );
}