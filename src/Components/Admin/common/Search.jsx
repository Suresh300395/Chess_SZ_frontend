const Search = () => {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5" sx={{ color: '#0b5299', fontWeight: '700', mb: 1, fontSize: { xs: '1rem', md: '2rem' } }}>
                Search
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 4 }}>
                Search for a student or coach.
            </Typography>
            <TextField fullWidth label="Search" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        </Box>
    );
};

export default Search;