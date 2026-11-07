import { formatDateDDMMYYYY } from './dateUtils';

/**
 * Format date safely
 */
const safeDate = (val) => {
  if (!val) return 'N/A';
  const formatted = formatDateDDMMYYYY(val);
  return formatted || String(val);
};

/**
 * Format room allocation string
 */
const formatRoom = (alloc) => {
  if (!alloc || !alloc.roomNumber) return 'Not Allocated';
  const parts = [];
  if (alloc.building) parts.push(alloc.building);
  if (alloc.floor) parts.push(`Fl ${alloc.floor}`);
  parts.push(`Room ${alloc.roomNumber}`);
  return parts.join(' - ');
};

/**
 * Export all registered teams and their complete player data to Excel (.xls XML Spreadsheet)
 * The first and primary sheet contains EVERY PLAYER'S FULL DETAILS so it opens immediately in Excel.
 *
 * @param {Array} registrations - Array of registration objects
 */
export const exportTeamsToExcel = (registrations = []) => {
  if (!registrations || registrations.length === 0) {
    alert('No registered teams data to export.');
    return;
  }

  const currentDate = new Date().toISOString().split('T')[0];
  const filename = `Aditya_University_Tournament_Players_Data_${currentDate}.xls`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>All Players and Teams Comprehensive Data</Title>
  <Subject>Aditya University All India Inter-University Sports Championship</Subject>
  <Author>Aditya University</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="HeaderBlue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0B5299" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderOrange">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#D06C38" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="HeaderNavy">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0D233B"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0D233B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TitleStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="16" ss:Color="#0B5299" ss:Bold="1"/>
  </Style>
  <Style ss:ID="SubTitleStyle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#64748B" ss:Italic="1"/>
  </Style>
  <Style ss:ID="DataEven">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataOdd">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CenterEven">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CenterOdd">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="UniHeaderRow">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D06C38"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D06C38"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="12" ss:Color="#0B5299" ss:Bold="1"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
  </Style>
 </Styles>`;

  // -------------------------------------------------------------
  // PRIMARY SHEET 1: ALL PLAYERS (FULL DETAILED DATA)
  // -------------------------------------------------------------
  let totalPlayersCount = 0;
  registrations.forEach(r => totalPlayersCount += (r.players?.length || 0));

  xml += `
 <!-- SHEET 1: ALL PLAYERS COMPLETE DATA -->
 <Worksheet ss:Name="All Players - Full Data">
  <Table ss:ExpandedColumnCount="15" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="45"/>
   <Column ss:Width="200"/>
   <Column ss:Width="170"/>
   <Column ss:Width="110"/>
   <Column ss:Width="75"/>
   <Column ss:Width="95"/>
   <Column ss:Width="105"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="95"/>
   <Column ss:Width="85"/>
   <Column ss:Width="95"/>
   <Column ss:Width="85"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>

   <!-- Title Row -->
   <Row ss:Height="28">
    <Cell ss:MergeAcross="14" ss:StyleID="TitleStyle"><Data ss:Type="String">ADITYA UNIVERSITY - COMPLETE PARTICIPATING PLAYERS ROSTER</Data></Cell>
   </Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="14" ss:StyleID="SubTitleStyle"><Data ss:Type="String">Report Generated on: ${new Date().toLocaleString('en-IN')} | Total Registered Players: ${totalPlayersCount} across ${registrations.length} Universities</Data></Cell>
   </Row>
   <Row ss:Height="8"/>

   <!-- Header Row -->
   <Row ss:Height="28">
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">S.No</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">University Name</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Player Name</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Mobile No</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Gender</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Date of Birth</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Accommodation</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Transport Mode</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Transport Number</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Arrival Date</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Arrival Time</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Departure Date</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Departure Time</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Allocated Room</Data></Cell>
    <Cell ss:StyleID="HeaderOrange"><Data ss:Type="String">Univ Contact</Data></Cell>
   </Row>`;

  let playerNum = 1;
  registrations.forEach((reg) => {
    const uniName = reg.universityName || 'N/A';
    const uniContact = reg.universityContact || 'N/A';
    const players = reg.players || [];

    if (players.length === 0) {
      const isOdd = playerNum % 2 === 1;
      const rowStyle = isOdd ? 'DataOdd' : 'DataEven';
      const centerStyle = isOdd ? 'CenterOdd' : 'CenterEven';
      xml += `
   <Row ss:Height="20">
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="Number">${playerNum++}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(uniName)}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">(No players registered yet)</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">N/A</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(uniContact)}</Data></Cell>
   </Row>`;
    } else {
      players.forEach((p) => {
        const isOdd = playerNum % 2 === 1;
        const rowStyle = isOdd ? 'DataOdd' : 'DataEven';
        const centerStyle = isOdd ? 'CenterOdd' : 'CenterEven';

        // Extract real player data matching Registration.js schema
        const pName = p.playerName || p.name || 'N/A';
        const pMobile = p.mobileNo || p.mobile || p.contact || 'N/A';
        const pGender = p.gender || 'N/A';
        const pDob = safeDate(p.dob);
        const pAcc = p.accommodation || 'Yes';
        const pTransMode = p.transportMode || 'N/A';
        const pTransNo = p.transportNumber || 'N/A';
        const pArrDate = safeDate(p.arrivalDate);
        const pArrTime = p.arrivalTime || 'N/A';
        const pDepDate = safeDate(p.departureDate);
        const pDepTime = p.departureTime || 'N/A';
        const pRoom = formatRoom(p.roomAllocation);

        xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="Number">${playerNum++}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(uniName)}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(pName)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pMobile)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pGender)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pDob)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pAcc)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pTransMode)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pTransNo)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pArrDate)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pArrTime)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pDepDate)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pDepTime)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(pRoom)}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(uniContact)}</Data></Cell>
   </Row>`;
      });
    }
  });

  xml += `
  </Table>
 </Worksheet>`;

  // -------------------------------------------------------------
  // SHEET 2: UNIVERSITY TEAMS OVERVIEW
  // -------------------------------------------------------------
  xml += `
 <Worksheet ss:Name="University Teams Overview">
  <Table ss:ExpandedColumnCount="7" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="45"/>
   <Column ss:Width="230"/>
   <Column ss:Width="130"/>
   <Column ss:Width="220"/>
   <Column ss:Width="95"/>
   <Column ss:Width="95"/>
   <Column ss:Width="110"/>
   
   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">S.No</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">University Name</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">Contact Details</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">Address</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">Total Players</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">Total Coaches</Data></Cell>
    <Cell ss:StyleID="HeaderBlue"><Data ss:Type="String">Registration Date</Data></Cell>
   </Row>`;

  registrations.forEach((reg, index) => {
    const isOdd = index % 2 === 1;
    const rowStyle = isOdd ? 'DataOdd' : 'DataEven';
    const centerStyle = isOdd ? 'CenterOdd' : 'CenterEven';
    const regDate = safeDate(reg.createdAt);
    const playersCount = reg.players?.length || 0;
    const coachesCount = reg.coaches?.length || 0;

    xml += `
   <Row ss:Height="22">
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="Number">${index + 1}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(reg.universityName || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(reg.universityContact || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(reg.address || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="Number">${playersCount}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="Number">${coachesCount}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${regDate}</Data></Cell>
   </Row>`;
  });

  xml += `
  </Table>
 </Worksheet>`;

  // -------------------------------------------------------------
  // SHEET 3: ALL COACHES & OFFICIALS
  // -------------------------------------------------------------
  xml += `
 <Worksheet ss:Name="Coaches and Officials">
  <Table ss:ExpandedColumnCount="9" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:Width="45"/>
   <Column ss:Width="200"/>
   <Column ss:Width="170"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="180"/>
   <Column ss:Width="75"/>
   <Column ss:Width="85"/>
   <Column ss:Width="105"/>

   <Row ss:Height="26">
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">S.No</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">University Name</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">Coach / Official Name</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">Role</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">Mobile No</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">Email ID</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">Gender</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">Food Type</Data></Cell>
    <Cell ss:StyleID="HeaderNavy"><Data ss:Type="String">Accommodation</Data></Cell>
   </Row>`;

  let coachNum = 1;
  registrations.forEach((reg) => {
    (reg.coaches || []).forEach((c) => {
      const isOdd = coachNum % 2 === 1;
      const rowStyle = isOdd ? 'DataOdd' : 'DataEven';
      const centerStyle = isOdd ? 'CenterOdd' : 'CenterEven';

      xml += `
   <Row ss:Height="20">
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="Number">${coachNum++}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(reg.universityName || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(c.name || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(c.role || 'Coach')}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(c.mobileNo || c.mobile || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${rowStyle}"><Data ss:Type="String">${escapeXml(c.mailId || c.email || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(c.gender || 'N/A')}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(c.foodType || 'Veg')}</Data></Cell>
    <Cell ss:StyleID="${centerStyle}"><Data ss:Type="String">${escapeXml(c.accommodation || 'Yes')}</Data></Cell>
   </Row>`;
    });
  });

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  triggerDownload(blob, filename);
};

/**
 * Export all registered teams as a print-perfect branded PDF report
 * Now includes FULL UNIVERSITY-WISE PLAYER ROSTERS!
 *
 * @param {Array} registrations - Array of registration objects
 * @param {Object} stats - Optional counts object
 */
export const exportTeamsToPDF = (registrations = [], stats = {}) => {
  if (!registrations || registrations.length === 0) {
    alert('No registered teams data to export.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let totalPlayers = 0;
  let totalCoaches = 0;
  registrations.forEach(r => {
    totalPlayers += (r.players?.length || 0);
    totalCoaches += (r.coaches?.length || 0);
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF report.');
    return;
  }

  // Generate university-by-university sections with players & coaches tables
  const sectionsHtml = registrations.map((reg, uIdx) => {
    const uniName = escapeXml(reg.universityName || 'N/A');
    const uniContact = escapeXml(reg.universityContact || 'N/A');
    const uniAddress = escapeXml(reg.address || 'N/A');
    const regDate = safeDate(reg.createdAt);
    const players = reg.players || [];
    const coaches = reg.coaches || [];

    const playersRows = players.length > 0 ? players.map((p, pIdx) => `
      <tr style="background-color: ${pIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; font-weight: 600; color: #64748b; padding: 6px 8px;">${pIdx + 1}</td>
        <td style="font-weight: 700; color: #0f172a; padding: 6px 10px;">${escapeXml(p.playerName || p.name || 'N/A')}</td>
        <td style="text-align: center; padding: 6px 8px; color: #334155;">${escapeXml(p.mobileNo || p.mobile || 'N/A')}</td>
        <td style="text-align: center; padding: 6px 6px;">${escapeXml(p.gender || 'N/A')}</td>
        <td style="text-align: center; padding: 6px 8px;">${safeDate(p.dob)}</td>
        <td style="text-align: center; padding: 6px 6px;">${escapeXml(p.accommodation || 'Yes')}</td>
        <td style="text-align: center; padding: 6px 8px;">${escapeXml(p.transportMode || 'N/A')} ${p.transportNumber ? `(${escapeXml(p.transportNumber)})` : ''}</td>
        <td style="text-align: center; padding: 6px 8px;">${safeDate(p.arrivalDate)} ${p.arrivalTime ? `&bull; ${escapeXml(p.arrivalTime)}` : ''}</td>
        <td style="text-align: center; padding: 6px 8px;">${formatRoom(p.roomAllocation)}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="9" style="text-align: center; padding: 10px; color: #64748b; font-style: italic;">
          No players registered for this university.
        </td>
      </tr>
    `;

    const coachesRows = coaches.length > 0 ? coaches.map((c, cIdx) => `
      <tr style="background-color: ${cIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="text-align: center; font-weight: 600; color: #64748b; padding: 6px 8px;">${cIdx + 1}</td>
        <td style="font-weight: 700; color: #0f172a; padding: 6px 10px;">${escapeXml(c.name || 'N/A')}</td>
        <td style="text-align: center; padding: 6px 8px; color: #0b5299; font-weight: 600;">${escapeXml(c.role || 'Coach')}</td>
        <td style="text-align: center; padding: 6px 8px; color: #334155;">${escapeXml(c.mobileNo || c.mobile || 'N/A')}</td>
        <td style="text-align: center; padding: 6px 8px; color: #64748b;">${escapeXml(c.mailId || c.email || 'N/A')}</td>
        <td style="text-align: center; padding: 6px 8px;">${escapeXml(c.foodType || 'Veg')}</td>
        <td style="text-align: center; padding: 6px 8px;">${escapeXml(c.accommodation || 'Yes')}</td>
      </tr>
    `).join('') : `
      <tr>
        <td colspan="7" style="text-align: center; padding: 10px; color: #64748b; font-style: italic;">
          No coaches listed.
        </td>
      </tr>
    `;

    return `
      <div class="uni-card" style="page-break-inside: avoid; margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
        <!-- University Header Bar -->
        <div style="background: linear-gradient(90deg, #0b5299 0%, #1e3a8a 100%); color: #ffffff; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="background: #d06c38; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-weight: 800; font-size: 11px; margin-right: 8px;">TEAM #${uIdx + 1}</span>
            <strong style="font-size: 15px; letter-spacing: 0.2px;">${uniName}</strong>
          </div>
          <div style="font-size: 11px; opacity: 0.95;">
            <strong>Contact:</strong> ${uniContact} | <strong>Reg Date:</strong> ${regDate}
          </div>
        </div>
        ${uniAddress !== 'N/A' ? `<div style="background: #f1f5f9; padding: 5px 14px; font-size: 11px; color: #475569; border-bottom: 1px solid #e2e8f0;"><strong>Address:</strong> ${uniAddress}</div>` : ''}

        <!-- Players Table -->
        <div style="padding: 10px 12px 6px 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #d06c38; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            &bull; Players Roster (${players.length})
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; font-size: 10.5px;">
                <th style="width: 35px; text-align: center; padding: 6px;">#</th>
                <th style="text-align: left; padding: 6px 10px;">Player Name</th>
                <th style="width: 95px; text-align: center; padding: 6px;">Mobile No</th>
                <th style="width: 55px; text-align: center; padding: 6px;">Gender</th>
                <th style="width: 80px; text-align: center; padding: 6px;">DOB</th>
                <th style="width: 70px; text-align: center; padding: 6px;">Accom.</th>
                <th style="width: 120px; text-align: center; padding: 6px;">Transport</th>
                <th style="width: 130px; text-align: center; padding: 6px;">Arrival</th>
                <th style="width: 110px; text-align: center; padding: 6px;">Room</th>
              </tr>
            </thead>
            <tbody>
              ${playersRows}
            </tbody>
          </table>
        </div>

        <!-- Coaches Table -->
        ${coaches.length > 0 ? `
        <div style="padding: 6px 12px 10px 12px;">
          <div style="font-size: 12px; font-weight: 700; color: #0b5299; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
            &bull; Coaches &amp; Officials (${coaches.length})
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; font-size: 10.5px;">
                <th style="width: 35px; text-align: center; padding: 5px;">#</th>
                <th style="text-align: left; padding: 5px 10px;">Name</th>
                <th style="width: 110px; text-align: center; padding: 5px;">Role</th>
                <th style="width: 95px; text-align: center; padding: 5px;">Mobile No</th>
                <th style="width: 150px; text-align: center; padding: 5px;">Email ID</th>
                <th style="width: 70px; text-align: center; padding: 5px;">Food Type</th>
                <th style="width: 70px; text-align: center; padding: 5px;">Accom.</th>
              </tr>
            </thead>
            <tbody>
              ${coachesRows}
            </tbody>
          </table>
        </div>
        ` : ''}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comprehensive Registered Teams & Players Report - Aditya University</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm 10mm;
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 10px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 3px solid #0b5299;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .header-title {
            font-size: 20px;
            font-weight: 800;
            color: #0b5299;
            margin: 0;
          }
          .header-subtitle {
            font-size: 12px;
            color: #d06c38;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-top: 3px;
          }
          .header-meta {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .stats-bar {
            display: flex;
            gap: 16px;
            margin-bottom: 14px;
          }
          .stat-badge {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 16px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .stat-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
          }
          .stat-val {
            font-size: 16px;
            font-weight: 800;
            color: #0b5299;
          }
          table th, table td {
            border: 1px solid #e2e8f0;
          }
          .footer {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="header-title">ADITYA UNIVERSITY</div>
            <div class="header-subtitle">All India Inter-University Sports Championship &bull; Full Participant Dossier</div>
          </div>
          <div class="header-meta">
            <div><strong>Report:</strong> Complete Player &amp; Team Details</div>
            <div><strong>Generated:</strong> ${currentDate}</div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-badge">
            <span class="stat-label">Total Universities:</span>
            <span class="stat-val">${registrations.length}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-label">Total Players:</span>
            <span class="stat-val" style="color: #0b5299;">${totalPlayers}</span>
          </div>
          <div class="stat-badge">
            <span class="stat-label">Total Coaches:</span>
            <span class="stat-val" style="color: #d06c38;">${totalCoaches}</span>
          </div>
        </div>

        ${sectionsHtml}

        <div class="footer">
          <div>Aditya University Sports Department &bull; Official Registration Records</div>
          <div>All India Inter-University Sports Portal</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Export a single team's complete dossier to PDF
 */
export const exportSingleTeamToPDF = (team) => {
  if (!team) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the team PDF.');
    return;
  }

  const playersHtml = (team.players || []).map((p, idx) => `
    <tr>
      <td style="text-align: center; padding: 7px 8px;">${idx + 1}</td>
      <td style="font-weight: 700; color: #0f172a; padding: 7px 10px;">${escapeXml(p.playerName || p.name || 'N/A')}</td>
      <td style="text-align: center; padding: 7px 8px;">${escapeXml(p.mobileNo || p.mobile || 'N/A')}</td>
      <td style="text-align: center; padding: 7px 8px;">${escapeXml(p.gender || 'N/A')}</td>
      <td style="text-align: center; padding: 7px 8px;">${safeDate(p.dob)}</td>
      <td style="text-align: center; padding: 7px 8px;">${escapeXml(p.accommodation || 'Yes')}</td>
      <td style="text-align: center; padding: 7px 8px;">${escapeXml(p.transportMode || 'N/A')} ${p.transportNumber ? `(${escapeXml(p.transportNumber)})` : ''}</td>
      <td style="text-align: center; padding: 7px 8px;">${safeDate(p.arrivalDate)} ${p.arrivalTime ? `&bull; ${escapeXml(p.arrivalTime)}` : ''}</td>
      <td style="text-align: center; padding: 7px 8px;">${formatRoom(p.roomAllocation)}</td>
    </tr>
  `).join('');

  const coachesHtml = (team.coaches || []).map((c, idx) => `
    <tr>
      <td style="text-align: center; padding: 7px 8px;">${idx + 1}</td>
      <td style="font-weight: 700; color: #0f172a; padding: 7px 10px;">${escapeXml(c.name || 'N/A')}</td>
      <td style="text-align: center; padding: 7px 10px; color: #0b5299; font-weight: 600;">${escapeXml(c.role || 'Coach')}</td>
      <td style="text-align: center; padding: 7px 10px;">${escapeXml(c.mobileNo || c.mobile || 'N/A')}</td>
      <td style="text-align: center; padding: 7px 10px;">${escapeXml(c.mailId || c.email || 'N/A')}</td>
      <td style="text-align: center; padding: 7px 10px;">${escapeXml(c.foodType || 'Veg')}</td>
      <td style="text-align: center; padding: 7px 10px;">${escapeXml(c.accommodation || 'Yes')}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Team Dossier - ${escapeXml(team.universityName)}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm 12mm; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
          .header { border-bottom: 2.5px solid #0b5299; padding-bottom: 10px; margin-bottom: 16px; }
          .title { font-size: 18px; font-weight: 800; color: #0b5299; margin: 0; }
          .subtitle { font-size: 12px; color: #d06c38; font-weight: 700; margin-top: 3px; }
          .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .info-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 2px; }
          .info-val { font-size: 13px; font-weight: 700; color: #1e293b; }
          .sec-title { font-size: 14px; font-weight: 700; color: #0b5299; margin: 16px 0 8px 0; border-left: 4px solid #d06c38; padding-left: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 14px; }
          th { background: #0b5299; color: white; padding: 7px 8px; text-align: left; font-size: 10.5px; border: 1px solid #0b5299; }
          td { border: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ADITYA UNIVERSITY - TEAM DOSSIER</div>
          <div class="subtitle">Official Team Registration Details</div>
        </div>

        <div class="info-box">
          <div><div class="info-label">University Name</div><div class="info-val">${escapeXml(team.universityName || 'N/A')}</div></div>
          <div><div class="info-label">Contact Details</div><div class="info-val">${escapeXml(team.universityContact || 'N/A')}</div></div>
          <div><div class="info-label">Registration Date</div><div class="info-val">${safeDate(team.createdAt)}</div></div>
          <div style="grid-column: span 3;"><div class="info-label">Address</div><div class="info-val" style="font-weight: 500;">${escapeXml(team.address || 'N/A')}</div></div>
        </div>

        <div class="sec-title">Players Roster (${(team.players || []).length})</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Player Name</th>
              <th style="width: 85px; text-align: center;">Mobile</th>
              <th style="width: 50px; text-align: center;">Gender</th>
              <th style="width: 75px; text-align: center;">DOB</th>
              <th style="width: 55px; text-align: center;">Accom.</th>
              <th style="width: 100px; text-align: center;">Transport</th>
              <th style="width: 110px; text-align: center;">Arrival</th>
              <th style="width: 90px; text-align: center;">Room</th>
            </tr>
          </thead>
          <tbody>${playersHtml || '<tr><td colspan="9" style="text-align: center; padding: 12px; color: #64748b;">No players registered</td></tr>'}</tbody>
        </table>

        <div class="sec-title">Coaches &amp; Officials (${(team.coaches || []).length})</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>Name</th>
              <th style="width: 100px; text-align: center;">Role</th>
              <th style="width: 90px; text-align: center;">Mobile</th>
              <th style="width: 120px; text-align: center;">Email</th>
              <th style="width: 65px; text-align: center;">Food</th>
              <th style="width: 60px; text-align: center;">Accom.</th>
            </tr>
          </thead>
          <tbody>${coachesHtml || '<tr><td colspan="7" style="text-align: center; padding: 12px; color: #64748b;">No coaches listed</td></tr>'}</tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
