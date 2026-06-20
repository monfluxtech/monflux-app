import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';

import Auth          from './pages/Auth';
import Onboarding    from './pages/Onboarding';
import Dashboard     from './pages/Dashboard';
import Projets       from './pages/Projets';
import ProjectDetail from './pages/ProjectDetail';
import Leads         from './pages/Leads';
import Soumissions   from './pages/Soumissions';
import Factures      from './pages/Factures';
import SousTraitants from './pages/SousTraitants';
import Contacts from './pages/Contacts';
import Rapport from './pages/Rapport';
import Punch         from './pages/Punch';
import PunchPublic   from './pages/PunchPublic';
import QuotePublic      from './pages/QuotePublic';
import InvoicePublic    from './pages/InvoicePublic';
import QuittancePublic  from './pages/QuittancePublic';
import ProjectPortal         from './pages/ProjectPortal';
import SubcontractorPortal  from './pages/SubcontractorPortal';
import ChangeOrderPublic    from './pages/ChangeOrderPublic';
import Chat          from './pages/Chat';
import Parametres    from './pages/Parametres';
import ComingSoon    from './pages/ComingSoon';

function Guard({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"              element={<Auth />} />
        <Route path="/punch/:token"       element={<PunchPublic />} />
        <Route path="/soumission/:token"  element={<QuotePublic />} />
        <Route path="/facture/:token"      element={<InvoicePublic />} />
        <Route path="/quittance/:token"   element={<QuittancePublic />} />
        <Route path="/portal/:token"              element={<ProjectPortal />} />
        <Route path="/sous-traitant/:token"       element={<SubcontractorPortal />} />
        <Route path="/modification/:token"        element={<ChangeOrderPublic />} />

        {/* Onboarding (requires token but no company yet) */}
        <Route path="/onboarding"    element={<Onboarding />} />

        {/* Protected */}
        <Route path="/dashboard"          element={<Guard><Dashboard /></Guard>} />
        <Route path="/projets"            element={<Guard><Projets /></Guard>} />
        <Route path="/projets/:id"        element={<Guard><ProjectDetail /></Guard>} />
        <Route path="/leads"              element={<Guard><Leads /></Guard>} />
        <Route path="/soumissions"        element={<Guard><Soumissions /></Guard>} />
        <Route path="/factures"           element={<Guard><Factures /></Guard>} />
        <Route path="/sous-traitants"     element={<Guard><SousTraitants /></Guard>} />
        <Route path="/contacts"           element={<Guard><Contacts /></Guard>} />
        <Route path="/rapport"            element={<Guard><Rapport /></Guard>} />
        {/* Modules activables — stubs jusqu'à leur batch dédié */}
        <Route path="/contrats"           element={<Guard><ComingSoon title="Contrats" batch="Batch 4" /></Guard>} />
        <Route path="/commandes"          element={<Guard><ComingSoon title="Commandes" batch="Batch 6" /></Guard>} />
        <Route path="/factures-achat"     element={<Guard><ComingSoon title="Factures d'achat" batch="Batch 6" /></Guard>} />
        <Route path="/punch"              element={<Guard><Punch /></Guard>} />
        <Route path="/chat"               element={<Guard><Chat /></Guard>} />
        <Route path="/parametres"         element={<Guard><Parametres /></Guard>} />

        {/* Legacy redirect */}
        <Route path="/project/:id"  element={<Navigate to="/projets" replace />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
