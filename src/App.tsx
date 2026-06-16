import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Tasks from '@/pages/Tasks';
import History from '@/pages/History';
import Stats from '@/pages/Stats';
import Exchange from '@/pages/Exchange';
import Profile from '@/pages/Profile';
import { useStore } from '@/store';

export default function App() {
  const refreshDaily = useStore((s) => s.refreshDaily);

  useEffect(() => {
    refreshDaily();
  }, [refreshDaily]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
}
