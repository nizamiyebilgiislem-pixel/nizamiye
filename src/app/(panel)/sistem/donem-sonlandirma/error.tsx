"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TermClosureSimulationError({ reset }: { reset: () => void }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="space-y-4 py-10 text-center">
        <p className="text-sm font-medium text-destructive">Dönem sonlandırma ekranı yüklenirken hata oluştu.</p>
        <Button type="button" variant="outline" onClick={reset}>
          Tekrar dene
        </Button>
      </CardContent>
    </Card>
  );
}
