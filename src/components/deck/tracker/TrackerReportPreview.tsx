"use client";

/**
 * Mockup visual do PDF mensal que o retainer entrega.
 * Componente puramente visual, sem dados reais.
 */

type Props = {
  companyName: string;
};

export function TrackerReportPreview({ companyName }: Props) {
  return (
    <div className="tracker-report-preview">
      <div className="tracker-report-cover">
        <span className="tracker-report-cover__eyebrow">RELATÓRIO MENSAL · GEO</span>
        <span className="tracker-report-cover__brand">destaque.ai</span>
        <span className="tracker-report-cover__client">{companyName}</span>
        <span className="tracker-report-cover__date">Maio · 2026</span>
      </div>
      <div className="tracker-report-thumbs">
        <div className="tracker-report-thumb">
          <span className="tracker-report-thumb__title">Sumário executivo</span>
          <div className="tracker-report-thumb__lines">
            <span /><span /><span style={{ width: "60%" }} />
          </div>
        </div>
        <div className="tracker-report-thumb">
          <span className="tracker-report-thumb__title">Citation rate · 6 motores</span>
          <div className="tracker-report-thumb__bars">
            <span style={{ height: "30%" }} />
            <span style={{ height: "50%" }} />
            <span style={{ height: "70%" }} />
            <span style={{ height: "45%" }} />
            <span style={{ height: "60%" }} />
            <span style={{ height: "55%" }} />
          </div>
        </div>
        <div className="tracker-report-thumb">
          <span className="tracker-report-thumb__title">Drift por prompt</span>
          <div className="tracker-report-thumb__lines">
            <span /><span style={{ width: "80%" }} /><span style={{ width: "40%" }} />
          </div>
        </div>
        <div className="tracker-report-thumb">
          <span className="tracker-report-thumb__title">Plano próximo mês</span>
          <div className="tracker-report-thumb__lines">
            <span style={{ width: "70%" }} /><span style={{ width: "55%" }} /><span style={{ width: "85%" }} />
          </div>
        </div>
      </div>
      <p className="tracker-report-preview__note">
        Entregue por email todos os meses · dashboard com acesso permanente
      </p>
    </div>
  );
}
