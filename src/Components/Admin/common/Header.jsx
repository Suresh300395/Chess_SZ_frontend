import React from 'react';
import { Box } from '@mui/material';
import ProfilePopover from '../../Common/ProfilePopover';
import { getAssetUrl } from '../../../utils/assetHelper';

const Header = () => {
    return (
        <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#ffffff',
            px: { xs: 2, sm: 3 },
            py: 1.25,
            zIndex: 10,
            borderBottom: '1px solid #f1f5f9'
        }}>
            {/* Left: Mobile/Tablet Branding */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    component="img"
                    src={getAssetUrl('Circle_logo.svg')}
                    alt="Aditya University"
                    sx={{
                        height: { xs: 48, sm: 56 },
                        width: 'auto',
                        display: { xs: 'block', lg: 'none' }
                    }}
                />
            </Box>

            {/* Reusable Profile Popover Component */}
            <ProfilePopover />
        </Box>
    );
};

export default Header;
