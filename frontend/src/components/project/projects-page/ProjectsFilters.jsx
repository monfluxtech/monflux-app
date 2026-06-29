import { Search } from 'lucide-react';

export default function ProjectsFilters({
  t,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  pipeline,
  showFilters,
  onToggleFilters,
  cityFilter,
  onCityFilterChange,
  managerFilter,
  onManagerFilterChange,
  valueMin,
  onValueMinChange,
  valueMax,
  onValueMaxChange,
  workTypeFilter,
  onWorkTypeFilterChange,
  dateFromFilter,
  onDateFromFilterChange,
  dateToFilter,
  onDateToFilterChange,
  onClearFilters,
}) {
  const activeFilters = [cityFilter, managerFilter, valueMin, valueMax, workTypeFilter, dateFromFilter, dateToFilter].filter(Boolean);

  return (
    <>
      <div className="flex gap-2 mb-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input id="proj-search" name="search" className="input pl-8" placeholder="Rechercher…" value={search} onChange={(event) => onSearchChange(event.target.value)} />
        </div>
        <select id="proj-status" name="status_filter" className="input w-auto text-sm" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
          <option value="">{t('all_statuses')}</option>
          {pipeline.map((stage) => (
            <option key={stage.key} value={stage.key}>{stage.label}</option>
          ))}
        </select>
        <button className={`btn-secondary text-xs px-3 ${showFilters ? 'bg-orange-50 border-brand text-brand' : ''}`} onClick={onToggleFilters}>
          {t('filters')}
          {activeFilters.length > 0 ? (
            <span className="ml-1 w-4 h-4 bg-brand text-white rounded-full text-[10px] flex items-center justify-center inline-flex">
              {activeFilters.length}
            </span>
          ) : null}
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-2 mb-4 flex-wrap bg-gray-50 rounded-xl p-3">
          <div className="flex-1 min-w-32">
            <label htmlFor="f-city" className="label text-[11px]">{t('filter_city')}</label>
            <input id="f-city" name="filter_city" className="input text-xs" placeholder="Montréal…" value={cityFilter} onChange={(event) => onCityFilterChange(event.target.value)} />
          </div>
          <div className="flex-1 min-w-32">
            <label htmlFor="f-work-type" className="label text-[11px]">Type de travaux</label>
            <input id="f-work-type" name="filter_work_type" className="input text-xs" placeholder="Rénovation…" value={workTypeFilter} onChange={(event) => onWorkTypeFilterChange(event.target.value)} />
          </div>
          <div className="flex-1 min-w-32">
            <label htmlFor="f-manager" className="label text-[11px]">{t('filter_manager')}</label>
            <input id="f-manager" name="filter_manager" className="input text-xs" placeholder="Nom…" value={managerFilter} onChange={(event) => onManagerFilterChange(event.target.value)} />
          </div>
          <div className="flex-1 min-w-28">
            <label htmlFor="f-date-from" className="label text-[11px]">Début après</label>
            <input id="f-date-from" name="filter_date_from" className="input text-xs" type="date" value={dateFromFilter} onChange={(event) => onDateFromFilterChange(event.target.value)} />
          </div>
          <div className="flex-1 min-w-28">
            <label htmlFor="f-date-to" className="label text-[11px]">Fin avant</label>
            <input id="f-date-to" name="filter_date_to" className="input text-xs" type="date" value={dateToFilter} onChange={(event) => onDateToFilterChange(event.target.value)} />
          </div>
          <div className="flex-1 min-w-28">
            <label htmlFor="f-val-min" className="label text-[11px]">{t('filter_value_min')}</label>
            <input id="f-val-min" name="filter_value_min" className="input text-xs" type="number" placeholder="0" value={valueMin} onChange={(event) => onValueMinChange(event.target.value)} />
          </div>
          <div className="flex-1 min-w-28">
            <label htmlFor="f-val-max" className="label text-[11px]">{t('filter_value_max')}</label>
            <input id="f-val-max" name="filter_value_max" className="input text-xs" type="number" placeholder="∞" value={valueMax} onChange={(event) => onValueMaxChange(event.target.value)} />
          </div>
          {activeFilters.length > 0 && (
            <div className="flex items-end">
              <button className="btn-ghost text-xs text-red-400" onClick={onClearFilters}>
                {t('clear_filters')}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
