/**
 * Root route configuration for the RoboLedger dashboard.
 *
 * The Hero landing page and Architecture page render standalone
 * (they have their own layouts). All dashboard sections render
 * inside the Shell layout with HUD nav and sidebar.
 */

import { Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Hero from './components/Hero';
import Fleet from './pages/Fleet';
import Tasks from './pages/Tasks';
import Proofs from './pages/Proofs';
import Trust from './pages/Trust';
import Demo from './pages/Demo';
import Archi from './pages/Archi';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hero />} />
      <Route path="/archi" element={<Archi />} />

      <Route element={<Shell />}>
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/proofs" element={<Proofs />} />
        <Route path="/trust" element={<Trust />} />
        <Route path="/demo" element={<Demo />} />
      </Route>
    </Routes>
  );
}
