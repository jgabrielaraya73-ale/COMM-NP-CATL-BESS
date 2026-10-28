import React, { useState } from 'react';

export default function ChartData({ sheetsSummary = [], sheetsDetail = {} }) {
  const [selectedSheet, setSelectedSheet] = useState(sheetsSummary[0]?.sheetName || 'Comisionado CATL');
  const [selectedSector, setSelectedSector] = useState('POWER BLOCK N°1');
  const [selectedDate, setSelectedDate] = useState('');
  const [gerencialFilter, setGerencialFilter] = useState('TODOS');

  const activePowerBlocks = sheetsDetail[selectedSheet] || [];

  const handlePrint = () => {
    window.print();
  };

  const allAvailableDates = Array.from(
    new Set(
      activePowerBlocks.flatMap((pb) =>
        pb.categorias.flatMap((cat) =>
          cat.tareas.map((t) => t.fechaEnsayo).filter((f) => f && f !== '-')
        )
      )
    )
  ).sort();

  let displayPowerBlocks = [];

  if (selectedDate) {
    displayPowerBlocks = activePowerBlocks.map((pb) => {
      const filteredCategories = pb.categorias.map((cat) => ({
        ...cat,
        tareas: cat.tareas.filter((t) => t.fechaEnsayo === selectedDate)
      })).filter((cat) => cat.tareas.length > 0);

      if (filteredCategories.length === 0) return null;

      return {
        ...pb,
        categorias: filteredCategories
      };
    }).filter(Boolean);
  } else {
    displayPowerBlocks = activePowerBlocks.filter((pb) => {
      if (gerencialFilter === 'COMPLETOS' && pb.porcentajeAvance < 100) return false;
      if (gerencialFilter === 'INCOMPLETOS' && pb.porcentajeAvance === 100) return false;

      if (selectedSector === 'TODOS' || gerencialFilter !== 'TODOS') return true;
      return pb.sectorName.toUpperCase() === selectedSector.toUpperCase();
    });
  }

  const totalTareasFiltradas = displayPowerBlocks.reduce((acc, pb) => acc + pb.categorias.reduce((accC, c) => accC + c.tareas.length, 0), 0);
  const completadasFiltradas = displayPowerBlocks.reduce((acc, pb) => acc + pb.categorias.reduce((accC, c) => accC + c.tareas.filter(t => t.completado).length, 0), 0);
  const porcentajeFiltrado = totalTareasFiltradas > 0 ? ((completadasFiltradas / totalTareasFiltradas) * 100).toFixed(1) : 0;

  const getCategoryIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('instalacion') || n.includes('instalación')) return '🛠️';
    if (n.includes('configuracion') || n.includes('configuración')) return '⚙️';
    if (n.includes('chequeo') || n.includes('pruebas') || n.includes('ensayo')) return '🔍';
    return '📋';
  };

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: #ffffff !important; color: #000000 !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      {/* TARJETAS SUPERIORES COMPACTAS */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-amber-500 shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-3">
          <h2 className="text-[11px] font-bold tracking-widest text-slate-300 uppercase">
            PLANES DE COLD COMMISSIONING
          </h2>
          
          <div className="flex flex-wrap items-center gap-2 no-print w-full lg:w-auto justify-end">
            <div className="bg-slate-900/90 border border-slate-700/60 p-1 rounded-lg flex items-center gap-1 shadow-inner">
              <span className="text-[9px] font-extrabold text-slate-400 px-2 uppercase tracking-wider hidden sm:inline">Vista Ejecutiva:</span>
              
              <button
                onClick={() => setGerencialFilter('TODOS')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all ${
                  gerencialFilter === 'TODOS'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                🔍 Todos
              </button>

              <button
                onClick={() => setGerencialFilter('COMPLETOS')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all ${
                  gerencialFilter === 'COMPLETOS'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-emerald-400 hover:bg-slate-800'
                }`}
              >
                ✅ 100% OK
              </button>

              <button
                onClick={() => setGerencialFilter('INCOMPLETOS')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all ${
                  gerencialFilter === 'INCOMPLETOS'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-amber-400 hover:bg-slate-800'
                }`}
              >
                ⚠️ Incompletos
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all font-bold flex items-center gap-1.5 shadow-sm"
              title="Descargar reporte en PDF"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sheetsSummary.map((sheet, sIdx) => {
            const isSelected = selectedSheet === sheet.sheetName;
            let badgeLabel = 'EN EJECUCIÓN';
            let badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';

            if (sheet.porcentaje === 100) {
              badgeLabel = '100% OK';
              badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            } else if (sheet.porcentaje === 0) {
              badgeLabel = 'PENDIENTE';
              badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            }

            return (
              <div
                key={sIdx}
                onClick={() => {
                  setSelectedSheet(sheet.sheetName);
                  setSelectedSector('POWER BLOCK N°1');
                  setSelectedDate('');
                  setGerencialFilter('TODOS');
                }}
                className={`bg-[#0b1226] border rounded-lg p-3 flex flex-col justify-between space-y-2 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-cyan-400/80 relative overflow-hidden ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20 -translate-y-1'
                    : 'border-slate-800'
                }`}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400/50" />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 truncate pl-1" title={sheet.sheetName}>
                      {sheet.sheetName}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border uppercase ${badgeColor}`}>
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1 pl-1">
                    <span className="text-xl font-black text-white">{sheet.porcentaje}%</span>
                  </div>

                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1.5 border border-slate-700/40">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${sheet.porcentaje}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] font-medium text-slate-400 pt-1.5 border-t border-slate-800 flex justify-between pl-1">
                  <span>Tareas: <strong className="text-slate-200">{sheet.totalTareas}</strong></span>
                  <span>OK: <strong className="text-emerald-400">{sheet.completadas}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DISEÑO DE DOS COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-1 lg:sticky lg:top-4 space-y-3 no-print">
          
          <div className="bg-white border-2 border-amber-500 rounded-xl p-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            
            <div className="border-b border-slate-200 pb-2 mb-2 pl-2">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                ⚡ Qué se hizo en el día
              </span>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mt-1">
                CONSULTAR POR FECHA
              </h3>
            </div>

            <div className="space-y-2 pt-1 pl-1">
              <select
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setGerencialFilter('TODOS');
                }}
                className="w-full bg-amber-50/50 border border-amber-300 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
              >
                <option value="">📅 Ver Power Blocks por separado</option>
                {allAvailableDates.map((dateStr, dIdx) => (
                  <option key={dIdx} value={dateStr}>
                    📆 Día: {dateStr}
                  </option>
                ))}
              </select>

              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="w-full text-xs bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                >
                  ✕ Quitar filtro de fecha
                </button>
              )}
            </div>
          </div>

          <div className={`bg-white border border-slate-300 rounded-xl p-4 shadow-xl relative overflow-hidden transition-opacity ${selectedDate || gerencialFilter !== 'TODOS' ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-500 to-indigo-600" />
            
            <div className="border-b border-slate-200 pb-2 mb-2 pl-2">
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase">
                Navegación
              </span>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mt-1">
                SECTORES ({selectedSheet})
              </h3>
              {(selectedDate || gerencialFilter !== 'TODOS') && <p className="text-[9px] text-amber-600 font-bold mt-1">(Desactivado por filtro activo)</p>}
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedSector('TODOS')}
                className={`w-full px-3 py-2 rounded-xl text-xs font-black transition-all duration-300 ease-out flex items-center justify-between border relative overflow-hidden group ${
                  selectedSector === 'TODOS'
                    ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-cyan-300 border-cyan-400 ring-2 ring-cyan-400/30 shadow-md shadow-cyan-500/20 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:-translate-y-0.5 hover:shadow-md hover:border-cyan-300 hover:bg-cyan-50/40'
                }`}
              >
                {selectedSector === 'TODOS' && <div className="absolute left-0 top-0 w-1 h-full bg-cyan-400 animate-pulse" />}
                <span className="tracking-wide">⚡ TODOS LOS SECTORES</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${selectedSector === 'TODOS' ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-slate-800 text-slate-200'}`}>
                  {activePowerBlocks.length}
                </span>
              </button>

              {activePowerBlocks.map((pb, pIdx) => {
                const isSelected = selectedSector.toUpperCase() === pb.sectorName.toUpperCase();
                const isCompleted = pb.porcentajeAvance === 100;
                const isInProgress = pb.porcentajeAvance > 0 && pb.porcentajeAvance < 100;

                // Lógica de colores vistosos para el badge de avance lateral
                let badgeStyle = 'bg-slate-200 text-slate-700 border-slate-300';
                if (isCompleted) {
                  badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-400 font-black shadow-xs';
                } else if (isInProgress) {
                  badgeStyle = 'bg-emerald-500 text-slate-950 border-emerald-600 font-black shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                } else if (isSelected) {
                  badgeStyle = 'bg-cyan-950 text-cyan-300 border-cyan-700';
                }

                return (
                  <button
                    key={pIdx}
                    onClick={() => setSelectedSector(pb.sectorName)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ease-out flex items-center justify-between border relative overflow-hidden group ${
                      isSelected
                        ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-cyan-300 border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/25 scale-[1.03] -translate-y-0.5'
                        : 'bg-slate-50/90 text-slate-700 border-slate-200 hover:-translate-y-1 hover:shadow-md hover:border-cyan-400 hover:bg-cyan-50/60'
                    }`}
                  >
                    {isSelected && <div className="absolute left-0 top-0 w-1.5 h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />}
                    
                    <span className="truncate text-left pl-1">{pb.sectorName}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-md border transition-colors ${badgeStyle}`}>
                      {pb.porcentajeAvance}%
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 pl-2 text-[10px] text-slate-600 font-medium flex justify-between">
              <span>Avance Filtro:</span>
              <strong className="text-emerald-600">{porcentajeFiltrado}%</strong>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-3 space-y-4">

          {gerencialFilter !== 'TODOS' && (
            <div className="bg-slate-900 border border-cyan-400 text-cyan-300 px-5 py-3 rounded-xl text-xs font-black flex items-center justify-between shadow-lg">
              <span className="text-sm">⚡ VISTA EJECUTIVA FILTRADA: <strong className="text-white underline">{gerencialFilter === 'COMPLETOS' ? 'Bloques al 100% OK' : 'Bloques Incompletos'}</strong></span>
              <button 
                onClick={() => setGerencialFilter('TODOS')}
                className="text-xs bg-cyan-500 text-slate-950 px-3 py-1.5 rounded-lg hover:bg-cyan-400 transition-colors font-bold shadow-sm"
              >
                Ver Todos
              </button>
            </div>
          )}

          {selectedDate && (
            <div className="bg-amber-500 border border-amber-600 text-slate-950 px-5 py-3 rounded-xl text-xs font-black flex items-center justify-between shadow-lg">
              <span className="text-sm">📅 REPORTE DIARIO DE OBRA — Fecha: <strong className="underline text-white bg-slate-900 px-2 py-0.5 rounded">{selectedDate}</strong></span>
              <button 
                onClick={() => setSelectedDate('')}
                className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
              >
                Volver a Ver Power Blocks
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xl relative overflow-hidden print-break-inside-avoid">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />

            <div className="flex justify-between items-center border-b border-slate-200 pb-2 pl-3">
              <div>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                  Métricas
                </span>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mt-0.5">
                  {selectedDate ? `RESUMEN DE ACTIVIDAD DEL DÍA (${selectedDate})` : gerencialFilter !== 'TODOS' ? `RESUMEN EJECUTIVO (${gerencialFilter})` : 'GRÁFICO COMPARATIVO DE AVANCE'}
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-500">
                Terminado vs Pendiente
              </span>
            </div>

            <div className="space-y-2.5 pt-3 pl-3">
              {displayPowerBlocks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 italic font-medium">
                  No se registran bloques que cumplan con el filtro seleccionado.
                </div>
              ) : (
                displayPowerBlocks.map((pb, idx) => {
                  const totalPbTareas = pb.categorias.reduce((acc, c) => acc + c.tareas.length, 0);
                  const totalPbCompletadas = pb.categorias.reduce((acc, c) => acc + c.tareas.filter(t => t.completado).length, 0);
                  const pbPorc = totalPbTareas > 0 ? ((totalPbCompletadas / totalPbTareas) * 100).toFixed(1) : 0;

                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-500" />
                          {pb.sectorName}
                        </span>
                        <span className="font-mono text-slate-700">
                          {totalPbCompletadas} / {totalPbTareas} Tareas <strong className="text-slate-900 ml-0.5">({pbPorc}%)</strong>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-lg overflow-hidden border border-slate-200 flex p-0.5 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-l-md transition-all duration-500"
                          style={{ width: `${pbPorc}%` }}
                        />
                        <div
                          className="bg-slate-300 h-full rounded-r-md transition-all duration-500"
                          style={{ width: `${100 - pbPorc}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-4">
            {displayPowerBlocks.length === 0 ? (
              <div className="bg-white border border-slate-300 rounded-xl p-8 text-center text-slate-500 text-xs shadow-md">
                No hay datos disponibles para este filtro.
              </div>
            ) : (
              displayPowerBlocks.map((pb, pbIdx) => {
                const totalPbTareas = pb.categorias.reduce((acc, c) => acc + c.tareas.length, 0);
                const totalPbCompletadas = pb.categorias.reduce((acc, c) => acc + c.tareas.filter(t => t.completado).length, 0);
                const pbPorc = totalPbTareas > 0 ? ((totalPbCompletadas / totalPbTareas) * 100).toFixed(1) : 0;

                return (
                  <div key={pbIdx} className="bg-white border border-slate-300 rounded-xl p-4 shadow-xl relative overflow-hidden print-break-inside-avoid">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-500 to-emerald-500" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2 pl-3">
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 bg-slate-900 text-cyan-400 border border-cyan-500/40 rounded-lg font-black text-[11px] uppercase shadow-sm">
                          {pb.sectorName}
                        </div>
                        <h3 className="text-xs font-black text-slate-900 tracking-wide uppercase">
                          PLAN DE ENSAYOS Y CONTROLES
                        </h3>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-[11px] font-bold text-slate-700 shadow-sm flex items-center gap-2">
                        <span>Tareas: <strong className="text-slate-900">{totalPbTareas}</strong></span>
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded border border-emerald-300 font-black">
                          {pbPorc}% OK
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 pl-3">
                      {pb.categorias.map((cat, cIdx) => (
                        <div key={cIdx} className="bg-slate-50/70 border border-slate-200 rounded-lg p-3 shadow-sm space-y-2">
                          <div className="bg-slate-900 text-white text-[12px] font-black px-3 py-2 rounded-md tracking-wider uppercase flex justify-between items-center shadow-sm">
                            <span className="flex items-center gap-2">
                              <span>{getCategoryIcon(cat.categoriaName)}</span>
                              <span>{cat.categoriaName}</span>
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono">{cat.tareas.length} TAREAS</span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-[13px] text-left text-slate-800 table-fixed">
                              <thead>
                                <tr className="text-[10px] text-slate-500 border-b border-slate-200 uppercase tracking-wider bg-white">
                                  <th className="py-2.5 px-2 font-bold w-[6%] text-center">EJEC.</th>
                                  <th className="py-2.5 px-2 font-bold w-[42%]">DESCRIPCIÓN DE TAREAS</th>
                                  <th className="py-2.5 px-2 font-bold w-[12%] text-center">ESTADO</th>
                                  <th className="py-2.5 px-2 font-bold w-[9%] text-center">FECHA</th>
                                  <th className="py-2.5 px-2 font-bold w-[12%]">EMPRESA</th>
                                  <th className="py-2.5 px-2 font-bold w-[12%]">REALIZADO</th>
                                  <th className="py-2.5 px-2 font-bold w-[7%]">NOTAS</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200/60 bg-white">
                                {cat.tareas.map((t, tIdx) => (
                                  <tr key={tIdx} className={`hover:bg-cyan-50/35 transition-colors ${t.completado ? 'bg-emerald-50/20' : ''}`}>
                                    <td className="py-3 px-2 text-center w-[6%]">
                                      <input
                                        type="checkbox"
                                        checked={t.completado}
                                        readOnly
                                        className="w-4 h-4 accent-emerald-600 rounded cursor-not-allowed"
                                      />
                                    </td>
                                    <td className="py-3 px-2 font-semibold text-slate-900 w-[42%] text-[13px] whitespace-nowrap truncate" title={t.descripcion}>
                                      {t.descripcion}
                                    </td>
                                    <td className="py-3 px-2 text-center w-[12%]">
                                      {t.completado ? (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-black inline-block">
                                          TERMINADO
                                        </span>
                                      ) : (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300 font-black inline-block">
                                          PENDIENTE
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-2 text-center font-mono text-slate-600 text-[10px] w-[9%] whitespace-nowrap truncate" title={t.fechaEnsayo}>
                                      {t.fechaEnsayo}
                                    </td>
                                    <td className="py-3 px-2 text-slate-700 font-medium text-[12px] w-[12%] whitespace-nowrap truncate" title={t.empresa}>
                                      {t.empresa}
                                    </td>
                                    <td className="py-3 px-2 text-slate-700 font-medium text-[12px] w-[12%] whitespace-nowrap truncate" title={t.realizadoPor}>
                                      {t.realizadoPor}
                                    </td>
                                    <td className="py-3 px-2 text-slate-500 text-[11px] italic w-[7%] whitespace-nowrap truncate" title={t.notas}>
                                      {t.notas}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>
    </div>
  );
}