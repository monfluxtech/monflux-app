import Layout from '../components/Layout';
import CalendarView from '../components/project/projects-page/CalendarView';
import GanttPortfolio from '../components/project/projects-page/GanttPortfolio';
import KanbanView from '../components/project/projects-page/KanbanView';
import MapView from '../components/project/projects-page/MapView';
import PipelineManager from '../components/project/projects-page/PipelineManager';
import PortfolioView from '../components/project/projects-page/PortfolioView';
import ProjectCard from '../components/project/projects-page/ProjectCard';
import ProjectModal from '../components/project/projects-page/ProjectModal';
import ProjectsFilters from '../components/project/projects-page/ProjectsFilters';
import ProjectsSummaryBar from '../components/project/projects-page/ProjectsSummaryBar';
import ProjectsToolbar from '../components/project/projects-page/ProjectsToolbar';
import { useT } from '../hooks/useT';
import useProjectsPageState from '../hooks/useProjectsPageState';

export default function Projets() {
  const t = useT();
  const {
    active,
    activeKpis,
    changeStage,
    cityFilter,
    clearFilters,
    dateFromFilter,
    dateToFilter,
    deleteProject,
    editItem,
    filtered,
    geocodeAll,
    geocoding,
    handleSave,
    items,
    load,
    loadError,
    loading,
    managerFilter,
    openProject,
    others,
    pipeOpen,
    pipeline,
    search,
    setCityFilter,
    setDateFromFilter,
    setDateToFilter,
    setEditItem,
    setManagerFilter,
    setPipeOpen,
    setSearch,
    setShowFilters,
    setShowNew,
    setStatusFilter,
    setValueMax,
    setValueMin,
    setView,
    setWorkTypeFilter,
    setPipeline,
    showFilters,
    showNew,
    stageMap,
    statusFilter,
    toggleKpi,
    valueMax,
    valueMin,
    view,
    workTypeFilter,
  } = useProjectsPageState();

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto">
        <ProjectsToolbar
          view={view}
          onChangeView={setView}
          activeKpis={activeKpis}
          onToggleKpi={toggleKpi}
          onOpenPipeline={() => setPipeOpen(true)}
          onNew={() => setShowNew(true)}
        />

        {showNew && <ProjectModal onClose={() => setShowNew(false)} onSave={handleSave} />}
        {editItem && <ProjectModal project={editItem} onClose={() => setEditItem(null)} onSave={handleSave} />}
        {pipeOpen && <PipelineManager pipeline={pipeline} onSave={setPipeline} onClose={() => setPipeOpen(false)} />}

        <ProjectsFilters
          t={t}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          pipeline={pipeline}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((open) => !open)}
          cityFilter={cityFilter}
          onCityFilterChange={setCityFilter}
          managerFilter={managerFilter}
          onManagerFilterChange={setManagerFilter}
          valueMin={valueMin}
          onValueMinChange={setValueMin}
          valueMax={valueMax}
          onValueMaxChange={setValueMax}
          workTypeFilter={workTypeFilter}
          onWorkTypeFilterChange={setWorkTypeFilter}
          dateFromFilter={dateFromFilter}
          onDateFromFilterChange={setDateFromFilter}
          dateToFilter={dateToFilter}
          onDateToFilterChange={setDateToFilter}
          onClearFilters={clearFilters}
        />

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-8">Chargement…</div>
        ) : view === 'map' ? (
          <MapView projects={filtered} onGeocodeAll={geocodeAll} geocoding={geocoding} stageMap={stageMap} />
        ) : view === 'kanban' ? (
          <KanbanView projects={filtered} pipeline={pipeline} stageMap={stageMap} onChangeStage={changeStage} onNew={() => setShowNew(true)} />
        ) : view === 'gantt' ? (
          <GanttPortfolio projects={filtered} stageMap={stageMap} />
        ) : view === 'calendar' ? (
          <CalendarView projects={filtered} stageMap={stageMap} />
        ) : view === 'portefeuille' ? (
          <PortfolioView projects={filtered} stageMap={stageMap} />
        ) : loadError ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-500 font-medium mb-2">Erreur de chargement</p>
            <p className="text-xs text-gray-400 mb-4">{loadError}</p>
            <button className="btn-primary text-xs" onClick={load}>Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {items.length === 0 ? 'Aucun projet. Créez-en un!' : 'Aucun projet ne correspond à votre recherche.'}
          </div>
        ) : (
          <>
            <ProjectsSummaryBar projects={filtered} />
            {active.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">En cours ({active.length})</p>
                <div className="grid gap-3">
                  {active.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      pipeline={pipeline}
                      stageMap={stageMap}
                      activeKpis={activeKpis}
                      onChangeStage={changeStage}
                      onEdit={setEditItem}
                      onDelete={deleteProject}
                      onOpen={openProject}
                    />
                  ))}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Terminés ({others.length})</p>
                <div className="grid gap-3">
                  {others.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      pipeline={pipeline}
                      stageMap={stageMap}
                      activeKpis={activeKpis}
                      onChangeStage={changeStage}
                      onEdit={setEditItem}
                      onDelete={deleteProject}
                      onOpen={openProject}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
