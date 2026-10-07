import { Tabs as MuiTabs, Tab, Box, styled, IconButton, useMediaQuery, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const StyledTabs = styled(MuiTabs)({
    backgroundColor: '#ffffff',
    borderRadius: '50px',
    padding: '4px',
    boxShadow: '0 4px 20px rgba(11, 82, 153, 0.08)',
    minHeight: 'auto',
    '& .MuiTabs-indicator': {
        height: '100%',
        borderRadius: '50px',
        backgroundColor: '#d06c38', // var(--color-orange)
        boxShadow: '0 4px 10px rgba(208, 108, 56, 0.3)',
        zIndex: 1,
    },
    '& .MuiTabs-flexContainer': {
        gap: '4px',
    },
    '@media (max-width: 768px)': {
        width: '100%',
        maxWidth: '280px',
    }
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)({
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '16px',
    color: '#0b5299', // var(--color-navy)
    minHeight: '40px',
    minWidth: 'unset',
    borderRadius: '50px',
    zIndex: 2,
    padding: '8px 24px',
    fontFamily: 'inherit',
    transition: 'color 0.3s ease',
    '&.Mui-selected': {
        color: '#ffffff',
    },
    '&:hover:not(.Mui-selected)': {
        color: '#d06c38',
    },
    '@media (max-width: 768px)': {
        fontSize: '14px',
        padding: '6px 12px',
        minWidth: '200px',
        width: '100%',
    }
});

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // MUI Tabs takes an index for value, so we find the index of activeTab
    const value = tabs.indexOf(activeTab) !== -1 ? tabs.indexOf(activeTab) : 0;

    const handleChange = (event, newValue) => {
        setActiveTab(tabs[newValue]);
    };

    const handlePrev = () => {
        const newIndex = Math.max(0, value - 1);
        setActiveTab(tabs[newIndex]);
    };

    const handleNext = () => {
        const newIndex = Math.min(tabs.length - 1, value + 1);
        setActiveTab(tabs[newIndex]);
    };

    return (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 1, px: 2, gap: 1 }}>
            {isMobile && (
                <IconButton 
                    onClick={handlePrev} 
                    disabled={value === 0}
                    sx={{ bgcolor: '#ffffff', color: '#0b5299', boxShadow: '0 4px 10px rgba(11,82,153,0.1)', '&:hover': { bgcolor: '#f0f0f0' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.5)' } }}
                >
                    <ChevronLeftIcon />
                </IconButton>
            )}

            <StyledTabs
                value={value}
                onChange={handleChange}
                variant={isMobile ? "standard" : "scrollable"}
                scrollButtons={false}
            >
                {tabs.map((tab, index) => (
                    <StyledTab 
                        key={index} 
                        label={tab} 
                        sx={{
                            display: (isMobile && value !== index) ? 'none' : 'inline-flex'
                        }}
                    />
                ))}
            </StyledTabs>

            {isMobile && (
                <IconButton 
                    onClick={handleNext} 
                    disabled={value === tabs.length - 1}
                    sx={{ bgcolor: '#ffffff', color: '#0b5299', boxShadow: '0 4px 10px rgba(11,82,153,0.1)', '&:hover': { bgcolor: '#f0f0f0' }, '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.5)' } }}
                >
                    <ChevronRightIcon />
                </IconButton>
            )}
        </Box>
    );
};

export default Tabs;