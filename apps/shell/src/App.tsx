import { useEffect } from "react";
import { Layout } from "./components/Layout";
import { MODULE_ROOT_ID } from "./config/routes";
import { usePathname } from "./hooks/useBus";
import { startMicroFrontends } from "./mfe/registerModules";
import { Overview } from "./pages/Overview";

export function App() {
  const path = usePathname();

  // Single-SPA só inicia depois que o container dos módulos existe no DOM
  useEffect(() => {
    startMicroFrontends();
  }, []);

  return (
    <Layout>
      {path === "/" && <Overview />}
      {/* React nunca renderiza filhos aqui: este nó pertence aos micro-frontends */}
      <div id={MODULE_ROOT_ID} hidden={path === "/"} />
    </Layout>
  );
}
