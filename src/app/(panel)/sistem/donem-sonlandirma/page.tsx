import { PageHeader } from "@/components/layout/page-header";
import { TermClosureSimulationPanel } from "@/components/terms/term-closure-simulation-panel";
import { requireRouteAccess } from "@/lib/auth";
import { getTermClosureRunHistory } from "@/lib/terms/closure-queries";
import { simulateTermClosure } from "@/lib/terms/simulation";
import { getCurrentAcademicTerm } from "@/lib/terms/queries";

export default async function TermClosureSimulationPage() {
  const { profile } = await requireRouteAccess("/sistem/donem-sonlandirma");

  const [activeTerm, runHistory] = await Promise.all([
    getCurrentAcademicTerm(),
    getTermClosureRunHistory(10),
  ]);

  let initialSimulationResult = null;
  if (activeTerm) {
    try {
      initialSimulationResult = await simulateTermClosure(activeTerm, profile);
    } catch {
      initialSimulationResult = null;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistem Yönetimi"
        title="Dönem Sonlandırma"
        description="Aktif dönem için güvenli simülasyon ve ön kontrol ekranı. Bu fazda gerçek dönem kapatma işlemi yapılmaz."
      />

      <TermClosureSimulationPanel
        activeTerm={activeTerm}
        runHistory={runHistory}
        initialSimulationResult={initialSimulationResult}
      />
    </div>
  );
}
