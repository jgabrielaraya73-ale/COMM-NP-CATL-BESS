import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ChartData from './components/ChartData';
import { parsePCySWorkbook } from './utils/excelParser';

const THEME_CONFIG = {
  backgroundColor: 'bg-[#FAF8F5]',
  textureStyle: {
    backgroundImage: 'radial-gradient(#d1c7bd 1px, transparent 1px)',
    backgroundSize: '16px 16px'
  },
  textColor: 'text-slate-800'
};

export default function App() {
  const [excelData, setExcelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchExcel = async () => {
      try {
        setLoading(true);
        const response = await fetch(`./PCyS.xlsx?v=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const buffer = await response.arrayBuffer();
        const parsed = parsePCySWorkbook(buffer);
        setExcelData(parsed);
        setErrorMsg(null);
      } catch (err) {
        console.error('Error procesando PCyS.xlsx:', err);
        setErrorMsg('Error al cargar PCyS.xlsx. Revisa que el archivo exista en la carpeta public.');
      } finally {
        setLoading(false);
      }
    };

    fetchExcel();
  }, []);

  return (
    <div 
      className={`min-h-screen ${THEME_CONFIG.backgroundColor} ${THEME_CONFIG.textColor} flex flex-col font-sans`}
      style={THEME_CONFIG.textureStyle}
    >
      <Header />
      <main className="flex-1 p-4 md:p-6 max-w-[1700px] mx-auto w-full space-y-4">
        
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-3 rounded-xl text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* Panel de Comisionamiento y Gráficos */}
        {excelData && (
          <ChartData 
            sheetsSummary={excelData.sheetsSummary} 
            sheetsDetail={excelData.sheetsDetail} 
          />
        )}
      </main>
    </div>
  );
}