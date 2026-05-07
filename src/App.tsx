import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import MySkills from './pages/MySkills';
import Marketplace from './pages/Marketplace';
import Settings from './pages/Settings';
import SettingsNew from './pages/SettingsNew';
import Executor from './pages/Executor';
import Codex from './pages/Codex';
import WorkflowEditor from './pages/WorkflowEditor';
import SchedulerPage from './pages/Scheduler';
import MonitoringDashboard from './pages/Monitoring';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/my-skills" replace />,
      },
      {
        path: 'my-skills',
        element: <MySkills />,
      },
      {
        path: 'marketplace',
        element: <Marketplace />,
      },
      {
        path: 'codex',
        element: <Codex />,
      },
      {
        path: 'executor',
        element: <Executor />,
      },
      {
        path: 'workflows',
        element: <WorkflowEditor />,
      },
      {
        path: 'scheduler',
        element: <SchedulerPage />,
      },
      {
        path: 'monitoring',
        element: <MonitoringDashboard />,
      },
      {
        path: 'settings',
        element: <SettingsNew />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/my-skills" replace />,
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;