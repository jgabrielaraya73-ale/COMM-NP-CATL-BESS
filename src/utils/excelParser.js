import * as XLSX from 'xlsx';

const parseNumber = (val) => {
  if (typeof val === 'number') return val;
  if (val === undefined || val === null || val === '') return 0;
  const cleanStr = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');
  if (cleanStr === '') return 0;
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
};

// Convierte números seriales de Excel o textos de fecha a formato legible DD/MM/YYYY
const formatExcelDate = (val) => {
  if (val === undefined || val === null || val === '' || val === '-') return '-';
  
  // Si es un número serial de Excel (ej: 46321)
  if (typeof val === 'number' || (!isNaN(val) && String(val).trim().length === 5)) {
    const num = Number(val);
    const utcDays = Math.floor(num - 25569);
    const utcValue = utcDays * 86400 * 1000;
    const dateInfo = new Date(utcValue);
    if (!isNaN(dateInfo.getTime())) {
      const day = String(dateInfo.getUTCDate()).padStart(2, '0');
      const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
      const year = dateInfo.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  
  return String(val).trim();
};

const isTaskCompleted = (val, estadoStr) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (val !== undefined && val !== null) {
    const str = String(val).trim().toLowerCase();
    if (str === 'true' || str === '1' || str === 'si' || str === 'sí' || str === 'x' || str === 'ok' || str === 'v' || str.includes('☑')) {
      return true;
    }
  }
  if (estadoStr) {
    const est = String(estadoStr).trim().toLowerCase();
    if (est.includes('terminad') || est.includes('completad') || est.includes('ok') || est.includes('finalizad')) {
      return true;
    }
  }
  return false;
};

export const parsePCySWorkbook = (buffer) => {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });

  const sheetsSummaryMap = {};
  const sheetsDetailMap = {};

  workbook.SheetNames.forEach((sheetName) => {
    const cleanSheetName = sheetName.trim();
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (!rawRows || rawRows.length < 2) return;

    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(6, rawRows.length); r++) {
      const rowStr = rawRows[r].join(' ').toLowerCase();
      if (rowStr.includes('sector') || rowStr.includes('descripcion') || rowStr.includes('ejecucion') || rowStr.includes('estado')) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = rawRows[headerRowIdx].map((h) => String(h).trim().toLowerCase());

    const colSector = headers.findIndex((h) => h.includes('sector') || h.includes('block') || h.includes('area'));
    const colDesc = headers.findIndex((h) => h.includes('descripcion') || h.includes('tarea'));
    const colEjec = headers.findIndex((h) => h.includes('ejecucion') || h.includes('ejecución') || h.includes('chk') || h.includes('check'));
    const colEstado = headers.findIndex((h) => h.includes('estado'));
    const colFecha = headers.findIndex((h) => h.includes('fecha') || h.includes('ensayo'));
    const colEmpresa = headers.findIndex((h) => h.includes('empresa') || h.includes('contratista'));
    const colRealizado = headers.findIndex((h) => h.includes('realizado') || h.includes('persona') || h.includes('responsable'));
    const colNotas = headers.findIndex((h) => h.includes('nota') || h.includes('comentario') || h.includes('observaci'));

    const powerBlocksMap = {};
    let totalTasksSheet = 0;
    let completedTasksSheet = 0;
    let currentCategory = 'GENERAL';
    let currentSector = 'POWER BLOCK N°1';

    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const rawSector = colSector !== -1 && row[colSector] !== undefined ? String(row[colSector]).trim() : '';
      const rawDesc = colDesc !== -1 && row[colDesc] !== undefined ? String(row[colDesc]).trim() : String(row[1] || row[0] || '').trim();
      const rawEjec = colEjec !== -1 ? row[colEjec] : row[2];
      const rawEstado = colEstado !== -1 ? String(row[colEstado] || '').trim() : '';
      const rawFecha = colFecha !== -1 ? row[colFecha] : '';
      const rawEmpresa = colEmpresa !== -1 ? String(row[colEmpresa] || '').trim() : '';
      const rawRealizado = colRealizado !== -1 ? String(row[colRealizado] || '').trim() : '';
      const rawNotas = colNotas !== -1 ? String(row[colNotas] || '').trim() : '';

      const fullRowStr = row.join(' ').toLowerCase().trim();

      if (
        fullRowStr.includes('total') ||
        fullRowStr.includes('acumulado') ||
        (!rawSector && !rawDesc && !rawEstado)
      ) {
        continue;
      }

      if (rawSector) {
        currentSector = rawSector.toUpperCase();
      }

      if (
        (!rawEjec && !rawEstado && !rawFecha && rawDesc) ||
        (rawDesc === rawDesc.toUpperCase() && rawDesc.length < 35 && !rawFecha && !rawRealizado)
      ) {
        currentCategory = rawDesc.toUpperCase();
        continue;
      }

      if (!rawDesc) continue;

      const completed = isTaskCompleted(rawEjec, rawEstado);

      if (!powerBlocksMap[currentSector]) {
        powerBlocksMap[currentSector] = {
          sectorName: currentSector,
          totalTareas: 0,
          completadas: 0,
          pendientes: 0,
          categoriasMap: {}
        };
      }

      if (!powerBlocksMap[currentSector].categoriasMap[currentCategory]) {
        powerBlocksMap[currentSector].categoriasMap[currentCategory] = {
          categoriaName: currentCategory,
          tareas: []
        };
      }

      powerBlocksMap[currentSector].totalTareas += 1;
      totalTasksSheet += 1;

      if (completed) {
        powerBlocksMap[currentSector].completadas += 1;
        completedTasksSheet += 1;
      } else {
        powerBlocksMap[currentSector].pendientes += 1;
      }

      powerBlocksMap[currentSector].categoriasMap[currentCategory].tareas.push({
        sector: currentSector,
        categoria: currentCategory,
        descripcion: rawDesc,
        completado: completed,
        estado: completed ? 'Terminado' : 'Pendiente',
        fechaEnsayo: formatExcelDate(rawFecha),
        empresa: rawEmpresa || '-',
        realizadoPor: rawRealizado || '-',
        notas: rawNotas || '-'
      });
    }

    const powerBlocksList = Object.values(powerBlocksMap).map((pb) => {
      const porcentaje = pb.totalTareas > 0 ? (pb.completadas / pb.totalTareas) * 100 : 0;
      const categorias = Object.values(pb.categoriasMap);
      return {
        ...pb,
        porcentajeAvance: parseFloat(Math.min(100, porcentaje).toFixed(1)),
        categorias
      };
    });

    powerBlocksList.sort((a, b) => {
      const numA = parseInt(a.sectorName.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.sectorName.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const sheetPorcentaje = totalTasksSheet > 0 ? (completedTasksSheet / totalTasksSheet) * 100 : 0;

    sheetsSummaryMap[cleanSheetName] = {
      sheetName: cleanSheetName,
      totalTareas: totalTasksSheet,
      completadas: completedTasksSheet,
      pendientes: totalTasksSheet - completedTasksSheet,
      porcentaje: parseFloat(Math.min(100, sheetPorcentaje).toFixed(1))
    };

    sheetsDetailMap[cleanSheetName] = powerBlocksList;
  });

  return {
    sheetsSummary: Object.values(sheetsSummaryMap),
    sheetsDetail: sheetsDetailMap
  };
};