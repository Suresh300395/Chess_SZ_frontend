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
    h1: { fontSize: '32px', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '26px', fontWeight: 700, lineHeight: 1.2 },
    h3: { fontSize: '22px', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '14px', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '14px', fontWeight: 400, lineHeight: 1.5 },
    body2: { fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
    subtitle1: { fontSize: '14px', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '13px', fontWeight: 500, lineHeight: 1.5 },
    button: { fontSize: '13px', fontWeight: 500, textTransform: 'none' },
    caption: { fontSize: '12px', fontWeight: 400, lineHeight: 1.4 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          height: '44px',
          padding: '10px 18px',
          borderRadius: '8px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeSmall: {
          height: '36px',
          padding: '6px 14px',
        },
        sizeLarge: {
          height: '48px',
          padding: '12px 24px',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontSize: '14px',
          backgroundColor: '#fff',
          minHeight: '44px',
        },
        input: {
          padding: '10.5px 12px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          fontWeight: 500,
          transform: 'translate(14px, 12px) scale(1)',
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.85)',
          },
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid #eaedf1',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: '12px',
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid #eaedf1',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'none',
        },
      },
    },
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
