import { money, num, realMargin, theoMargin } from './projectUtils';

export default function ProjectsSummaryBar({ projects }) {
  if (!projects.length) return null;

  const totalContract = projects.reduce((sum, project) => sum + num(project.contract_value), 0);
  const totalInvoiced = projects.reduce((sum, project) => sum + num(project.invoiced_real), 0);
  const totalReal = projects.reduce((sum, project) => sum + realMargin(project), 0);
  const totalTheo = projects.reduce((sum, project) => sum + theoMargin(project), 0);

  const Stat = ({ label, value, color }) => (
    <div className="flex-1 min-w-[110px]">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${color || 'text-gray-900'}`}>{money(value)}</p>
    </div>
  );

  return (
    <div className="card mb-5 flex flex-wrap gap-4">
      <Stat label="Valeur portefeuille" value={totalContract} />
      <Stat label="Facturé" value={totalInvoiced} />
      <Stat label="Marge théorique" value={totalTheo} color={totalTheo >= 0 ? 'text-green-600' : 'text-red-500'} />
      <Stat label="Marge réelle" value={totalReal} color={totalReal >= 0 ? 'text-green-600' : 'text-red-500'} />
    </div>
  );
}
