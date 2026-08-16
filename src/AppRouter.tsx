import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import SpecPage from "./pages/SpecPage";
import RegistryPage from "./pages/RegistryPage";
import QueryPage from "./pages/QueryPage";
import ExplorerPage from "./pages/ExplorerPage";
import AuditPage from "./pages/AuditPage";
import ImplementationsPage from "./pages/ImplementationsPage";
import SettingsPage from "./pages/SettingsPage";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/spec" element={<SpecPage />} />
        <Route path="/registry" element={<RegistryPage />} />
        <Route path="/query" element={<QueryPage />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/implementations" element={<ImplementationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;