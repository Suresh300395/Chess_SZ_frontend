import './App.css'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Toaster } from 'sonner'
import Home from './Components/Home'
import Registration from './Components/Registration/Registration'
import Authentication from './Components/Admin/Authentication'
import Main_layout from './Components/Admin/common/Main_layout'
import Dashboard from './Components/Admin/Dashboard'
import OrganizingCommitee from './Components/Admin/OrganizingCommitee'
import PlayersMapping from './Components/Admin/PlayersMapping'
import HostelProvision from './Components/Admin/HostelProvision'
import FoodTokens from './Components/Admin/FoodTokens'
import CautionDeposite from './Components/Admin/CautionDeposite'
import ManageAdmin from './Components/Admin/ManageAdmin'

const theme = createTheme({
  typography: {
    fontFamily: [
      'Montserrat',
      'system-ui',
      '-apple-system',
      'sans-serif'
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/registration" element={<Registration />} />
        
        {/* Admin Login */}
        <Route path="/admin" element={<Authentication />} />
        
        {/* Admin Dashboard & Other Protected Pages with Common Layout */}
        <Route element={<Main_layout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/organizing-committee" element={<OrganizingCommitee />} />
          <Route path="/admin/players-mapping" element={<PlayersMapping />} />
          <Route path="/admin/hostel-provision" element={<HostelProvision />} />
          <Route path="/admin/food-tokens" element={<FoodTokens />} />
          <Route path="/admin/caution-deposite" element={<CautionDeposite />} />
          <Route path="/admin/manage-admin" element={<ManageAdmin />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App
