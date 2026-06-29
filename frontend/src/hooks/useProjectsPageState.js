import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { projects as projectsApi } from '../api';
import { DEFAULT_PIPELINE } from '../config/modules';
import { useConfigStore } from '../store';
import { ALL_KPIS, looksLikeRealAddress } from '../components/project/projects-page/projectUtils';

export default function useProjectsPageState() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1');
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pipeOpen, setPipeOpen] = useState(false);
  const [view, setView] = useState('list');
  const [geocoding, setGeocoding] = useState(false);
  const [activeKpis, setActiveKpis] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mf_proj_kpis') || '["contract","margin","dates","plan_actual"]');
      return saved.map((key) => (key === 'progress' ? 'plan_actual' : key));
    } catch {
      return ['contract', 'margin', 'dates', 'plan_actual'];
    }
  });

  const storePipeline = useConfigStore((state) => state.pipeline);
  const loadCfg = useConfigStore((state) => state.load);
  const setPipeline = useConfigStore((state) => state.setPipeline);
  const pipeline = storePipeline && storePipeline.length ? storePipeline : DEFAULT_PIPELINE;
  const stageMap = useMemo(() => Object.fromEntries(pipeline.map((stage) => [stage.key, stage])), [pipeline]);
  const isTerminal = useCallback((project) => !!stageMap[project.status]?.terminal, [stageMap]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await projectsApi.list();
      setItems(data);
    } catch (err) {
      setLoadError(err?.response?.data?.error || 'Impossible de charger les projets. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadCfg();
  }, [load, loadCfg]);

  useEffect(() => {
    const handler = (event) => {
      const { id: projectId, ...fields } = event.detail || {};
      if (projectId) {
        setItems((current) => current.map((project) => (project.id === projectId ? { ...project, ...fields } : project)));
      }
    };

    window.addEventListener('monflux:project-updated', handler);
    return () => window.removeEventListener('monflux:project-updated', handler);
  }, []);

  const toggleKpi = useCallback((key) => {
    setActiveKpis((current) => {
      const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      localStorage.setItem('mf_proj_kpis', JSON.stringify(next));
      return next;
    });
  }, []);

  const changeStage = useCallback(async (id, status) => {
    setItems((current) => current.map((project) => (project.id === id ? { ...project, status } : project)));
    try {
      await projectsApi.update(id, { status });
    } catch {}
  }, []);

  const handleSave = useCallback((data, isEdit) => {
    if (isEdit) {
      setItems((current) => current.map((project) => (project.id === data.id ? { ...project, ...data } : project)));
    } else {
      setItems((current) => [data, ...current]);
      navigate(`/projets/${data.id}`);
    }
    setShowNew(false);
    setEditItem(null);
  }, [navigate]);

  const deleteProject = useCallback(async (id) => {
    if (!confirm('Supprimer ce projet ?')) return;
    await projectsApi.delete(id);
    setItems((current) => current.filter((project) => project.id !== id));
  }, []);

  const filtered = useMemo(() => items.filter((project) => {
    const query = search.toLowerCase();
    const matchSearch = !query
      || project.name?.toLowerCase().includes(query)
      || project.address?.toLowerCase().includes(query)
      || project.city?.toLowerCase().includes(query)
      || project.description?.toLowerCase().includes(query)
      || project.project_manager?.toLowerCase().includes(query);
    const matchStatus = !statusFilter || project.status === statusFilter;
    const matchCity = !cityFilter || (project.city || project.address || '').toLowerCase().includes(cityFilter.toLowerCase());
    const matchManager = !managerFilter || (project.project_manager || '').toLowerCase().includes(managerFilter.toLowerCase());
    const matchValueMin = !valueMin || Number(project.contract_value) >= Number(valueMin);
    const matchValueMax = !valueMax || Number(project.contract_value) <= Number(valueMax);
    const matchWorkType = !workTypeFilter || (project.field_assessment?.work_type || project.type || '').toLowerCase().includes(workTypeFilter.toLowerCase());
    const matchDateFrom = !dateFromFilter || (project.start_date && String(project.start_date).slice(0, 10) >= dateFromFilter);
    const matchDateTo = !dateToFilter || (project.end_date && String(project.end_date).slice(0, 10) <= dateToFilter);
    return matchSearch && matchStatus && matchCity && matchManager && matchValueMin && matchValueMax && matchWorkType && matchDateFrom && matchDateTo;
  }), [cityFilter, dateFromFilter, dateToFilter, items, managerFilter, search, statusFilter, valueMax, valueMin, workTypeFilter]);

  const active = useMemo(() => filtered.filter((project) => !isTerminal(project)), [filtered, isTerminal]);
  const others = useMemo(() => filtered.filter((project) => isTerminal(project)), [filtered, isTerminal]);

  const geocodeAll = useCallback(async () => {
    const missing = items.filter((project) => looksLikeRealAddress(project.address) && (!project.latitude || !project.longitude));
    if (!missing.length) return;
    setGeocoding(true);
    for (const project of missing) {
      try {
        const { data } = await projectsApi.geocode(project.id);
        setItems((current) => current.map((item) => (item.id === project.id ? { ...item, latitude: data.latitude, longitude: data.longitude } : item)));
      } catch (err) {
        console.warn(`Géocodage échoué pour "${project.address || project.name}":`, err?.response?.data?.error || err.message);
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
    setGeocoding(false);
  }, [items]);

  useEffect(() => {
    if (view === 'map' && items.some((project) => project.address && !project.latitude)) {
      geocodeAll();
    }
  }, [view, items, geocodeAll]);

  const clearFilters = useCallback(() => {
    setCityFilter('');
    setManagerFilter('');
    setValueMin('');
    setValueMax('');
    setWorkTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  }, []);

  const openProject = useCallback((id) => {
    navigate(`/projets/${id}`);
  }, [navigate]);

  return {
    allKpis: ALL_KPIS,
    items,
    filtered,
    active,
    others,
    loading,
    loadError,
    showNew,
    setShowNew,
    editItem,
    setEditItem,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    cityFilter,
    setCityFilter,
    managerFilter,
    setManagerFilter,
    valueMin,
    setValueMin,
    valueMax,
    setValueMax,
    workTypeFilter,
    setWorkTypeFilter,
    dateFromFilter,
    setDateFromFilter,
    dateToFilter,
    setDateToFilter,
    showFilters,
    setShowFilters,
    pipeOpen,
    setPipeOpen,
    view,
    setView,
    geocoding,
    activeKpis,
    toggleKpi,
    pipeline,
    stageMap,
    setPipeline,
    changeStage,
    handleSave,
    deleteProject,
    geocodeAll,
    clearFilters,
    load,
    openProject,
  };
}
