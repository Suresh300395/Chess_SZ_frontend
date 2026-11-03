import { Tabs as MuiTabs, Tab, Box, styled, IconButton, useMediaQuery, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const getTabValue = (tab) => (typeof tab === 'object' && tab !== null ? (tab.value !== undefined ? tab.value : tab.label) : tab);
const getTabLabel = (tab) => (typeof tab === 'object' && tab !== null ? tab.label : tab);
const getTabIcon = (tab) => (typeof tab === 'object' && tab !== null ? tab.icon : undefined);
const getTabIconPosition = (tab) => (typeof tab === 'object' && tab !== null && tab.iconPosition ? tab.iconPosition : 'start');

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
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    '@media (max-width: 899.95px)': {
        flex: 1,
        width: '100%',
        maxWidth: '100%',
        '& .MuiTabs-scroller': {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        '& .MuiTabs-flexContainer': {
            width: '100%',
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        '& .MuiTabs-indicator': {
            width: '100% !important',
            left: '0 !important',
            transform: 'none !important',
        }
    }
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '16px',
    color: '#0b5299', // var(--color-navy)
    minHeight: '42px',
    minWidth: 'unset',
    maxWidth: 'none',
    borderRadius: '50px',
    zIndex: 2,
    padding: '8px 22px',
    fontFamily: 'inherit',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '8px',
    '& .MuiTab-iconWrapper': {
        margin: '0 !important',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'inherit',
        fontSize: '1.25rem',
        transition: 'color 0.3s ease',
    },
    '&.Mui-selected': {
        color: '#ffffff',
        '& .MuiTab-iconWrapper': {
            color: '#ffffff',
        }
    },
    '&:hover:not(.Mui-selected)': {
        color: '#d06c38',
        '& .MuiTab-iconWrapper': {
            color: '#d06c38',
        }
    },
    '@media (max-width: 899.95px)': {
        fontSize: '15px',
        padding: '8px 16px',
        minWidth: 'unset',
        maxWidth: 'none !important',
        width: '100% !important',
        flex: '1 1 100% !important',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        textAlign: 'center !important',
        margin: '0 auto !important',
        '&.Mui-selected': {
            backgroundColor: '#d06c38',
            borderRadius: '50px',
        }
    }
});

const Tabs = ({ tabs = [], activeTab, setActiveTab, onChange, sx }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // MUI Tabs takes an index for value, so we find the index of activeTab
    const value = tabs.findIndex(tab => getTabValue(tab) === activeTab);
    const activeIndex = value !== -1 ? value : 0;

    const handleChange = (event, newIndex) => {
        const selected = tabs[newIndex];
        const val = getTabValue(selected);
        if (setActiveTab) setActiveTab(val);
        if (onChange) onChange(event, val);
    };

    const handlePrev = () => {
        const newIndex = Math.max(0, activeIndex - 1);
        const val = getTabValue(tabs[newIndex]);
        if (setActiveTab) setActiveTab(val);
        if (onChange) onChange(null, val);
    };

    const handleNext = () => {
        const newIndex = Math.min(tabs.length - 1, activeIndex + 1);
        const val = getTabValue(tabs[newIndex]);
        if (setActiveTab) setActiveTab(val);
        if (onChange) onChange(null, val);
    };

    return (
        <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 0.5,
            px: 0,
            gap: { xs: 0.75, sm: 1 },
            boxSizing: 'border-box',
            ...sx
        }}>
            {isMobile && (
                <IconButton
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    sx={{
                        bgcolor: '#ffffff',
                        color: '#0b5299',
                        boxShadow: '0 4px 10px rgba(11,82,153,0.1)',
                        flexShrink: 0,
                        width: { xs: 38, sm: 40 },
                        height: { xs: 38, sm: 40 },
                        '&:hover': { bgcolor: '#f0f0f0' },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.5)' }
                    }}
                >
                    <ChevronLeftIcon />
                </IconButton>
            )}

            <StyledTabs
                value={activeIndex}
                onChange={handleChange}
                variant={isMobile ? "fullWidth" : "scrollable"}
                scrollButtons={false}
            >
                {tabs.map((tab, index) => (
                    <StyledTab
                        key={index}
                        icon={getTabIcon(tab)}
                        iconPosition={getTabIconPosition(tab)}
                        label={getTabLabel(tab)}
                        sx={{
                            display: (isMobile && activeIndex !== index) ? 'none !important' : 'flex !important',
                            justifyContent: 'center !important',
                            alignItems: 'center !important',
                            textAlign: 'center !important',
                            width: isMobile ? '100% !important' : 'auto',
                            maxWidth: 'none !important',
                            flex: isMobile ? '1 1 100% !important' : 'initial',
                            margin: '0 auto !important',
                        }}
                    />
                ))}
            </StyledTabs>

            {isMobile && (
                <IconButton
                    onClick={handleNext}
                    disabled={activeIndex === tabs.length - 1}
                    sx={{
                        bgcolor: '#ffffff',
                        color: '#0b5299',
                        boxShadow: '0 4px 10px rgba(11,82,153,0.1)',
                        flexShrink: 0,
                        width: { xs: 38, sm: 40 },
                        height: { xs: 38, sm: 40 },
                        '&:hover': { bgcolor: '#f0f0f0' },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.5)' }
                    }}
                >
                    <ChevronRightIcon />
                </IconButton>
            )}
        </Box>
    );
};

export default Tabs;
