import { Tabs as MuiTabs, Tab, Box, Typography, styled, IconButton, useMediaQuery, useTheme } from '@mui/material';
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
});

const Tabs = ({ tabs = [], activeTab, setActiveTab, onChange, sx }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // MUI Tabs takes an index for value, so we find the index of activeTab
    const value = tabs.findIndex(tab => getTabValue(tab) === activeTab);
    const activeIndex = value !== -1 ? value : 0;
    const currentTab = tabs[activeIndex] || tabs[0];

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

    // Mobile View: Render single active tab pill with previous / next navigation arrows
    if (isMobile) {
        return (
            <Box sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                py: 0.5,
                px: 1,
                gap: { xs: 0.8, sm: 1.2 },
                boxSizing: 'border-box',
                ...sx
            }}>
                <IconButton
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    aria-label="Previous tab"
                    sx={{
                        bgcolor: '#ffffff',
                        color: '#0b5299',
                        boxShadow: '0 4px 10px rgba(11,82,153,0.1)',
                        flexShrink: 0,
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        '&:hover': { bgcolor: '#f0f0f0' },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.6)', opacity: 0.35 }
                    }}
                >
                    <ChevronLeftIcon />
                </IconButton>

                <Box
                    onClick={() => {
                        if (tabs.length > 1) {
                            const nextIdx = (activeIndex + 1) % tabs.length;
                            const val = getTabValue(tabs[nextIdx]);
                            if (setActiveTab) setActiveTab(val);
                            if (onChange) onChange(null, val);
                        }
                    }}
                    sx={{
                        flex: 1,
                        maxWidth: { xs: '290px', sm: '350px' },
                        backgroundColor: '#d06c38',
                        color: '#ffffff',
                        borderRadius: '50px',
                        py: '9px',
                        px: { xs: 1.8, sm: 2.5 },
                        boxShadow: '0 4px 12px rgba(208, 108, 56, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        cursor: tabs.length > 1 ? 'pointer' : 'default',
                        userSelect: 'none',
                        transition: 'all 0.25s ease',
                        '&:active': { transform: 'scale(0.98)' }
                    }}
                >
                    {getTabIcon(currentTab) && (
                        <Box sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '1.2rem',
                            flexShrink: 0
                        }}>
                            {getTabIcon(currentTab)}
                        </Box>
                    )}
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: { xs: '13px', sm: '14.5px' },
                            color: '#ffffff',
                            textAlign: 'center',
                            lineHeight: 1.25,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {getTabLabel(currentTab)}
                    </Typography>
                </Box>

                <IconButton
                    onClick={handleNext}
                    disabled={activeIndex === tabs.length - 1}
                    aria-label="Next tab"
                    sx={{
                        bgcolor: '#ffffff',
                        color: '#0b5299',
                        boxShadow: '0 4px 10px rgba(11,82,153,0.1)',
                        flexShrink: 0,
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        '&:hover': { bgcolor: '#f0f0f0' },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.6)', opacity: 0.35 }
                    }}
                >
                    <ChevronRightIcon />
                </IconButton>
            </Box>
        );
    }

    // Desktop View: Render full pill with all tabs and sliding indicator
    return (
        <Box sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 0.5,
            px: 0,
            boxSizing: 'border-box',
            ...sx
        }}>
            <StyledTabs
                value={activeIndex}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons={false}
            >
                {tabs.map((tab, index) => (
                    <StyledTab
                        key={index}
                        icon={getTabIcon(tab)}
                        iconPosition={getTabIconPosition(tab)}
                        label={getTabLabel(tab)}
                    />
                ))}
            </StyledTabs>
        </Box>
    );
};

export default Tabs;
