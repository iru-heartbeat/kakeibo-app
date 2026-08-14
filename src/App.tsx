import { useEffect } from 'react'
import { NavLink, Route, HashRouter as Router, Routes } from 'react-router-dom'
import { seedIfEmpty } from './db/seed'
import { materializeFixedCosts } from './hooks/useFixedCosts'
import { Aggregation } from './pages/Aggregation'
import { History } from './pages/History'
import { Home } from './pages/Home'

function App() {
  useEffect(() => {
    seedIfEmpty().then(() => materializeFixedCosts())
  }, [])

  return (
    <Router>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/aggregation" element={<Aggregation />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
        <nav className="bottom-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            入力
          </NavLink>
          <NavLink to="/aggregation" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            集計
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            履歴
          </NavLink>
        </nav>
      </div>
    </Router>
  )
}

export default App
