import { formatDateDDMMYYYY } from './dateUtils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { getAssetUrl } from './assetHelper';

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

/**
 * Convert numbers to English currency words
 */
export const getAmountInWords = (num) => {
  const n = Number(num);
  if (!n) return 'Rupees Zero Only';
  if (n === 2000) return 'Rupees Two Thousand Only';
  if (n === 1000) return 'Rupees One Thousand Only';
  if (n === 3000) return 'Rupees Three Thousand Only';
  if (n === 4000) return 'Rupees Four Thousand Only';
  if (n === 5000) return 'Rupees Five Thousand Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const toWords = (val) => {
    if (val === 0) return '';
    if (val < 20) return a[val] + ' ';
    if (val < 100) return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '') + ' ';
    if (val < 1000) return toWords(Math.floor(val / 100)) + 'Hundred ' + toWords(val % 100);
    if (val < 100000) return toWords(Math.floor(val / 1000)) + 'Thousand ' + toWords(val % 1000);
    if (val < 10000000) return toWords(Math.floor(val / 100000)) + 'Lakh ' + toWords(val % 100000);
    return toWords(Math.floor(val / 10000000)) + 'Crore ' + toWords(val % 10000000);
  };
  return `Rupees ${toWords(n).trim()} Only`;
};

/**
 * Convert an image URL to Base64 data URL
 */
const convertImageToBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
};

/**
 * Direct PDF File Downloader using jsPDF & html2canvas
 * Creates a pixel-perfect, official caution deposit receipt matching the official template.
 */
export const downloadCautionDepositPDF = async (data) => {
  if (!data) return;

  const isCoach = Boolean(
    data.isCoach ||
    data.role === 'Coach' ||
    data.paidByRole === 'Coach' ||
    data.userType === 'coach'
  );

  const amount = Number(data.amount || 2000);
  const receiptNo = data.receiptNo || 'CD-MANUAL';
  const universityName = data.universityName || 'Aditya University';

  let payerName = '';
  if (isCoach) {
    payerName = data.coachName || data.paidBy || data.name || 'Coach';
    if (data.coachRole && !payerName.includes('(')) {
      payerName += ` (${data.coachRole})`;
    } else if (!payerName.includes('(')) {
      payerName += ' (Coach)';
    }
  } else {
    payerName = data.paidBy || data.name || 'Representative';
    const role = data.paidByRole || data.role || 'Player';
    if (role && !payerName.includes('(')) {
      payerName += ` (${role})`;
    }
  }

  const payerPhone = data.paidByPhone || data.phone || data.mobileNo || 'N/A';
  const rawRoom = data.roomNumber || (data.rooms && data.rooms.length > 0 ? (data.rooms[0]?.roomNumber || data.rooms[0]) : null);
  const roomDisplay = rawRoom
    ? (String(rawRoom).toLowerCase().startsWith('room') ? rawRoom : `Room ${rawRoom}`)
    : 'Room 02';
  const paymentMode = data.paymentMode || 'Cash';
  const receiptDate = data.paidAt ? new Date(data.paidAt).toLocaleDateString('en-US') : new Date().toLocaleDateString('en-US');
  const amountWords = getAmountInWords(amount);

  // Load logo as base64 for seamless canvas rendering
  const logoUrl = getAssetUrl('ADITYA LOGO2.png');
  let logoBase64 = logoUrl;
  try {
    logoBase64 = await convertImageToBase64(logoUrl);
  } catch (err) {
    console.warn('Could not convert logo to base64, using direct url', err);
  }

  // Create temporary offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '780px';
  container.style.background = '#ffffff';
  container.style.boxSizing = 'border-box';
  container.style.padding = '0';
  container.style.margin = '0';
  container.style.zIndex = '-9999';

  container.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
      .cd-pdf-card, .cd-pdf-card * {
        font-family: 'Montserrat', system-ui, -apple-system, sans-serif !important;
      }
    </style>
    <div class="cd-pdf-card" style="width: 780px; background: #ffffff; color: #0f172a; padding: 14px 18px; font-family: 'Montserrat', system-ui, -apple-system, sans-serif; box-sizing: border-box; border: 1.5px solid #cbd5e1; border-radius: 10px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; justify-content: center; padding-right: 16px; border-right: 1.5px solid #e2e8f0; min-width: 135px;">
          <img src="${logoBase64}" alt="Aditya University" style="height: 50px; width: auto; object-fit: contain; display: block;" />
        </div>
        <div style="flex: 1; text-align: center;">
          <div style="font-weight: 900; color: #0b3b80; font-size: 15.5px; letter-spacing: 0.3px; text-transform: uppercase; line-height: 1.25;">
            SOUTH ZONE INTER-UNIVERSITY TOURNAMENT
          </div>
          <div style="font-weight: 800; color: #334155; font-size: 12px; letter-spacing: 0.2px; text-transform: uppercase; margin-top: 3px;">
            HOSTEL ACCOMMODATION - ${isCoach ? 'COACH' : 'TEAM'} CAUTION DEPOSIT RECEIPT
          </div>
          <div style="color: #64748b; font-size: 10.5px; margin-top: 2px;">
            (Official Cash / Manual Payment Voucher)
          </div>
        </div>
      </div>

      <!-- 2-Tone Accent Line -->
      <div style="display: flex; height: 3.5px; width: 130px; margin: 6px auto 10px; border-radius: 2px; overflow: hidden;">
        <div style="flex: 1; background: #ea580c;"></div>
        <div style="flex: 1; background: #0284c7;"></div>
      </div>
      <div style="border-top: 1px solid #e2e8f0; margin-bottom: 10px;"></div>

      <!-- Receipt No & Date Banner -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 16px; margin-bottom: 12px;">
        <div>
          <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">Receipt No.</div>
          <div style="font-weight: 900; color: #0f172a; font-size: 15.5px; letter-spacing: 0.5px; margin-top: 2px;">
            ${receiptNo}
          </div>
        </div>
        <div style="width: 1px; height: 28px; background: #cbd5e1;"></div>
        <div style="text-align: right;">
          <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">Date &amp; Time</div>
          <div style="font-weight: 900; color: #0f172a; font-size: 15.5px; margin-top: 2px; display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#0284c7"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
            <span>${receiptDate}</span>
          </div>
        </div>
      </div>

      <!-- Main Details Grid (2 columns: 50% / 50%) -->
      <div style="display: flex; gap: 16px; margin-bottom: 12px;">
        <!-- Left Column -->
        <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
          <!-- University -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0284c7"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>
            </div>
            <div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">University / Institution</div>
              <div style="font-weight: 800; color: #0b5299; font-size: 14px; line-height: 1.25; margin-top: 1px;">
                ${universityName}
              </div>
            </div>
          </div>

          <!-- Received From (Paid By) -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0284c7"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">Received From (Paid By)</div>
              <div style="font-weight: 800; color: #0f172a; font-size: 14px; line-height: 1.25; margin-top: 1px;">
                ${payerName}
              </div>
              <div style="font-size: 10.5px; color: #64748b; margin-top: 1px;">
                Phone: ${payerPhone}
              </div>
            </div>
          </div>

          <!-- Payment Mode -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0284c7"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
            </div>
            <div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">Payment Mode</div>
              <div style="font-weight: 800; color: #0f172a; font-size: 14px; line-height: 1.25; margin-top: 1px;">
                ${paymentMode} (Manual Receipt)
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
          <!-- Mint Green Amount Card -->
          <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 9px; padding: 11px 15px; box-sizing: border-box;">
            <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">Amount Received</div>
            <div style="font-size: 30px; font-weight: 900; color: #059669; line-height: 1.15; margin: 3px 0 5px;">
              ₹${amount.toLocaleString('en-IN')}
            </div>
            <div style="border-top: 1px solid #bbf7d0; margin: 5px 0;"></div>
            <div style="font-size: 10px; color: #64748b; font-weight: 600;">Amount in Words</div>
            <div style="font-weight: 800; color: #0f172a; font-size: 11.5px; margin-top: 2px;">
              ${amountWords}
            </div>
          </div>

          <!-- Allotted Room -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0284c7"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
            </div>
            <div>
              <div style="font-size: 10.5px; color: #64748b; font-weight: 600;">Allotted Hostel Room</div>
              <div style="font-weight: 800; color: #0f172a; font-size: 14px; line-height: 1.25; margin-top: 1px;">
                ${roomDisplay}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #e2e8f0; margin: 10px 0;"></div>

      <!-- Note Banner -->
      <div style="display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 7px 12px; margin-bottom: 12px;">
        <div style="width: 18px; height: 18px; border-radius: 50%; background: #ea580c; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #ffffff; font-weight: 900; font-size: 10.5px;">
          !
        </div>
        <div style="font-size: 11px; color: #334155;">
          <strong style="color: #c2410c;">Note:</strong> Refundable at checkout upon hostel room clearance and key return.
        </div>
      </div>

      <!-- Footer: University Address & Signature -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 4px;">
        <div>
          <div style="font-weight: 800; color: #0f172a; font-size: 12px;">Aditya University</div>
          <div style="color: #64748b; font-size: 10px; margin-top: 1px;">
            Surampalem, Kakinada District, Andhra Pradesh - 533437
          </div>
        </div>
        <div style="text-align: center; min-width: 160px;">
          <div style="border-bottom: 1.5px dotted #94a3b8; width: 100%; margin-bottom: 3px;"></div>
          <div style="color: #64748b; font-size: 10px; font-weight: 600;">
            Authorised Signature
          </div>
        </div>
      </div>

      <!-- Bottom Decorative Bar -->
      <div style="display: flex; height: 3.5px; width: 100%; border-radius: 1px; overflow: hidden; margin-top: 5px;">
        <div style="flex: 1; background: #ea580c;"></div>
        <div style="flex: 1; background: #0284c7;"></div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await new Promise((r) => setTimeout(r, 80));

    const canvas = await html2canvas(container, {
      scale: 2, // 2x high resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageMargin = 4;
    const topMargin = 4;
    const printWidth = pageWidth - (pageMargin * 2); // 202mm (tight margins on left & right)
    const printHeight = (canvas.height * printWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', pageMargin, topMargin, printWidth, printHeight);
    pdf.save(`Caution_Deposit_Receipt_${receiptNo}.pdf`);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Export Caution Deposit Receipt as Direct Printable PDF
 */
export const exportCautionDepositReceiptPDF = (data) => {
  if (!data) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print your caution deposit receipt.');
    return;
  }

  const amount = Number(data.amount || 2000);
  const receiptNo = escapeXml(data.receiptNo || 'CD-MANUAL');
  const universityName = escapeXml(data.universityName || 'Institution / University');
  const payerName = escapeXml(data.paidBy || 'Representative');
  const payerRole = escapeXml(data.paidByRole || (data.isCoach ? 'Coach' : 'Player'));
  const payerPhone = escapeXml(data.paidByPhone || 'N/A');
  const paymentMode = escapeXml(data.paymentMode || 'Cash');
  const roomNumber = data.roomNumber ? `Room ${escapeXml(data.roomNumber)}` : 'Room Allocated';
  const building = escapeXml(data.building || 'Hostel Campus');
  const paidDate = data.paidAt ? new Date(data.paidAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  const amountWords = getAmountInWords(amount);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Caution Deposit Receipt - ${receiptNo}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 15mm 15mm; }
          * { box-sizing: border-box; font-family: 'Montserrat', system-ui, -apple-system, sans-serif !important; }
          body {
            font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 24px;
            background: #ffffff;
          }
          .receipt-container {
            max-width: 780px;
            margin: 0 auto;
            border: 1.5px solid #cbd5e1;
            border-radius: 12px;
            padding: 28px 32px;
            background: #ffffff;
            position: relative;
          }
          .header-row {
            display: flex;
            align-items: center;
            gap: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e2e8f0;
          }
          .logo-box img {
            height: 60px;
            width: auto;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
            text-align: center;
          }
          .header-text h1 {
            margin: 0;
            font-size: 19px;
            font-weight: 900;
            color: #0b3b80;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .header-text h2 {
            margin: 5px 0 0;
            font-size: 13px;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          .header-text p {
            margin: 3px 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .accent-bar {
            display: flex;
            height: 4px;
            width: 140px;
            margin: 12px auto 16px;
            border-radius: 2px;
            overflow: hidden;
          }
          .bar-orange { flex: 1; background: #ea580c; }
          .bar-blue { flex: 1; background: #0284c7; }

          .meta-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 20px;
            margin-bottom: 22px;
          }
          .meta-item { display: flex; flex-direction: column; }
          .meta-lbl { font-size: 10.5px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-val { font-size: 15px; color: #0f172a; font-weight: 900; }
          .meta-val.green { color: #059669; }

          .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 22px;
          }
          .field-group {
            margin-bottom: 14px;
          }
          .field-label {
            font-size: 11px;
            color: #64748b;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 3px;
          }
          .field-value {
            font-size: 14.5px;
            color: #0f172a;
            font-weight: 800;
          }
          .field-sub {
            font-size: 11.5px;
            color: #64748b;
            margin-top: 2px;
          }

          .amount-card {
            background: #f0fdf4;
            border: 2px solid #86efac;
            border-radius: 10px;
            padding: 16px 20px;
          }
          .amount-card .amt-num {
            font-size: 32px;
            font-weight: 900;
            color: #059669;
            margin: 4px 0 8px;
            line-height: 1;
          }
          .amount-card .amt-words {
            font-size: 12px;
            font-weight: 800;
            color: #166534;
          }

          .notice-box {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-left: 4px solid #2563eb;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 28px;
          }
          .notice-title {
            font-size: 11.5px;
            font-weight: 800;
            color: #1e40af;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .notice-text {
            font-size: 11.5px;
            color: #1e3a8a;
            line-height: 1.5;
            margin: 0;
          }

          .signatures-row {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 14px;
          }
          .sig-box {
            text-align: center;
            width: 200px;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            margin-bottom: 6px;
          }
          .sig-text {
            font-size: 11px;
            color: #475569;
            font-weight: 700;
          }

          @media print {
            body { padding: 0; background: transparent; }
            .receipt-container { border: 1.5px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header-row">
            <div class="logo-box">
              <img src="${window.location.origin}${getAssetUrl('ADITYA LOGO2.png')}" alt="Aditya University" />
            </div>
            <div class="header-text">
              <h1>SOUTH ZONE INTER-UNIVERSITY TOURNAMENT</h1>
              <h2>HOSTEL ACCOMMODATION - CAUTION DEPOSIT RECEIPT</h2>
              <p>Aditya University Campus, Surampalem, Kakinada Dist, Andhra Pradesh - 533437</p>
            </div>
          </div>

          <div class="accent-bar">
            <div class="bar-orange"></div>
            <div class="bar-blue"></div>
          </div>

          <div class="meta-box">
            <div class="meta-item">
              <span class="meta-lbl">Receipt No.</span>
              <span class="meta-val">${receiptNo}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Payment Date</span>
              <span class="meta-val">${paidDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-lbl">Status</span>
              <span class="meta-val green">✓ Active Deposit Paid</span>
            </div>
          </div>

          <div class="content-grid">
            <div>
              <div class="field-group">
                <div class="field-label">University / Institution</div>
                <div class="field-value" style="color: #0b5299;">${universityName}</div>
              </div>

              <div class="field-group">
                <div class="field-label">Received From (Payer)</div>
                <div class="field-value">${payerName}</div>
                <div class="field-sub">Role: ${payerRole} &bull; Phone: ${payerPhone}</div>
              </div>

              <div class="field-group">
                <div class="field-label">Payment Mode</div>
                <div class="field-value">${paymentMode} (Counter Collection)</div>
              </div>
            </div>

            <div>
              <div class="amount-card">
                <div class="field-label" style="color: #166534;">Caution Deposit Amount</div>
                <div class="amt-num">₹${amount.toLocaleString('en-IN')}</div>
                <div class="field-label" style="color: #166534; margin-top: 6px;">Amount in Words</div>
                <div class="amt-words">${amountWords}</div>
              </div>

              <div class="field-group" style="margin-top: 14px;">
                <div class="field-label">Allotted Accommodation</div>
                <div class="field-value">${roomNumber}</div>
                <div class="field-sub">${building}</div>
              </div>
            </div>
          </div>

          <div class="notice-box">
            <div class="notice-title">Security &amp; Refund Policy Note</div>
            <p class="notice-text">
              This Caution Deposit is <strong>100% refundable</strong> upon checkout, hostel room vacancy clearance, and key return. An OTP will be sent to the payer's mobile phone to authorize the cash refund at checkout counter.
            </p>
          </div>

          <div class="signatures-row">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-text">Payer Signature / Handover</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-text">Hostel Desk Officer &bull; Stamp</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
