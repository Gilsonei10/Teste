import { useState, useMemo, useEffect } from 'react';
import { Header, type AppTab } from './components/Header';
import { BaseAndRNCard } from './components/BaseAndRNCard';
import { PointsTable } from './components/PointsTable';
import { ContourControls } from './components/ContourControls';
import { TopographyCanvas } from './components/TopographyCanvas';
import { StatsBar } from './components/StatsBar';
import { ImportModal } from './components/ImportModal';
import { RNDetectorTab } from './components/RNDetector/RNDetectorTab';
import type { TopographyPoint, BaseStation, ReferenceLevelMark, ContourSettings } from './types/topography';
import { computeDelaunayTriangulation } from './utils/delaunay';
import { generateContours } from './utils/contouring';
import { generateDXF, downloadFile } from './utils/dxfExporter';
import { exportToCSV } from './utils/fileParser';
import { SAMPLE_BASE, SAMPLE_RN, generateSampleSurvey } from './utils/sampleData';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('survey');
  const [points, setPoints] = useState<TopographyPoint[]>(() => generateSampleSurvey());
  const [base, setBase] = useState<BaseStation>(SAMPLE_BASE);
  const [rn, setRN] = useState<ReferenceLevelMark>(SAMPLE_RN);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [settings, setSettings] = useState<ContourSettings>({
    equidistance: 1.0,
    masterInterval: 5,
    showContours: true,
    showTriangles: true,
    showPoints: true,
    showElevations: true,
    showPointNames: true,
    showBaseAndRN: true,
    showMap: true,
    mapProvider: 'google_earth',
    utmZone: 24,
  });

  const handleToggleMap = () => {
    setSettings((s) => ({ ...s, showMap: !s.showMap }));
  };

  // Triangulation (TIN) computation (memoized)
  const triangles = useMemo(() => {
    return computeDelaunayTriangulation(points);
  }, [points]);

  // Contours computation (memoized)
  const contours = useMemo(() => {
    return generateContours(triangles, settings);
  }, [triangles, settings]);

  // Handle Point Updates
  const handleUpdatePoint = (index: number, updated: TopographyPoint) => {
    setPoints((prev) => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const handleDeletePoint = (index: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPoint = (newPt: TopographyPoint) => {
    const ptWithDelta: TopographyPoint = {
      ...newPt,
      deltaZ: rn.knownElevation ? Math.round((newPt.z - rn.knownElevation) * 1000) / 1000 : undefined,
    };
    setPoints((prev) => [...prev, ptWithDelta]);
  };

  // Recalculate Elevation Delta (dZ) for all points against RN
  const handleApplyElevationAdjustment = () => {
    if (!rn.knownElevation) {
      alert('Defina a cota oficial do RN primeiro.');
      return;
    }
    setPoints((prev) =>
      prev.map((pt) => ({
        ...pt,
        deltaZ: Math.round((pt.z - rn.knownElevation) * 1000) / 1000,
      }))
    );
  };

  // Swap Este (X) and Norte (Y) for all points (essential for UTM coordinate inversion)
  const handleSwapXY = () => {
    setPoints((prev) =>
      prev.map((pt) => ({
        ...pt,
        x: pt.y,
        y: pt.x,
      }))
    );
    if (base.x && base.y) {
      setBase((prev) => ({
        ...prev,
        x: prev.y,
        y: prev.x,
      }));
    }
  };

  // Auto-correção: se os pontos atuais estiverem com X > 1.000.000 (Norte) e Y < 1.000.000 (Este), inverte para UTM correto
  useEffect(() => {
    if (points.length > 0 && points[0].x > 1000000 && points[0].y < 1000000) {
      handleSwapXY();
    }
  }, [points]);

  // Import points with auto-adapt of relief and Base detection
  const handleImportPoints = (imported: TopographyPoint[]) => {
    if (imported.length === 0) return;

    // Se as coordenadas vieram com Norte no X (> 1M) e Este no Y (< 1M), inverte para ordem UTM padrão
    let finalPoints = imported;
    if (finalPoints[0].x > 1000000 && finalPoints[0].y < 1000000) {
      finalPoints = finalPoints.map((p) => ({
        ...p,
        x: p.y,
        y: p.x,
      }));
    }

    // Check relief difference (deltaZ)
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of finalPoints) {
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    }
    const deltaZ = maxZ - minZ;

    // Auto-adjust equidistance so contour lines show up immediately
    if (deltaZ > 0 && deltaZ <= 1.0) {
      setSettings((s) => ({ ...s, equidistance: 0.05, masterInterval: 5 }));
    } else if (deltaZ > 1.0 && deltaZ <= 3.0) {
      setSettings((s) => ({ ...s, equidistance: 0.1, masterInterval: 5 }));
    } else if (deltaZ > 3.0 && deltaZ <= 10.0) {
      setSettings((s) => ({ ...s, equidistance: 0.5, masterInterval: 5 }));
    } else {
      setSettings((s) => ({ ...s, equidistance: 1.0, masterInterval: 5 }));
    }

    // Auto-detect base point if any point has name or description with 'base'
    const basePt = finalPoints.find(
      (p) =>
        p.name.toLowerCase().includes('base') ||
        p.description.toLowerCase().includes('base')
    );
    if (basePt) {
      setBase((prev) => ({
        ...prev,
        name: basePt.name,
        x: basePt.x,
        y: basePt.y,
        z: basePt.z,
        description: `Importado: ${basePt.description}`,
      }));
    } else if (finalPoints.length > 0) {
      // If default base is thousands of km away, update to first point
      const dist = Math.hypot(base.x - finalPoints[0].x, base.y - finalPoints[0].y);
      if (dist > 50000) {
        setBase((prev) => ({
          ...prev,
          name: `BASE_${finalPoints[0].name}`,
          x: finalPoints[0].x,
          y: finalPoints[0].y,
          z: finalPoints[0].z,
        }));
      }
    }

    const withDelta = finalPoints.map((pt) => ({
      ...pt,
      deltaZ: rn.knownElevation ? Math.round((pt.z - rn.knownElevation) * 1000) / 1000 : undefined,
    }));
    setPoints(withDelta);
  };

  // Export DXF
  const handleExportDXF = () => {
    if (points.length < 3) return;
    const dxfString = generateDXF(
      points,
      base,
      rn,
      triangles,
      contours,
      settings.showTriangles
    );
    downloadFile(dxfString, `levantamento_curvas_nivel_${Date.now()}.dxf`, 'application/dxf');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (points.length === 0) return;
    const csvString = exportToCSV(points, false);
    downloadFile(csvString, `planilha_coordenadas_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  // Load Sample
  const handleLoadSample = () => {
    setBase(SAMPLE_BASE);
    setRN(SAMPLE_RN);
    setPoints(generateSampleSurvey());
  };

  // Clear
  const handleClear = () => {
    if (window.confirm('Deseja realmente limpar todos os pontos do levantamento?')) {
      setPoints([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onImportClick={() => setIsImportModalOpen(true)}
        onExportDXF={handleExportDXF}
        onExportCSV={handleExportCSV}
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        pointsCount={points.length}
      />

      <main className="flex-1 p-4 md:p-6 space-y-4 max-w-[1700px] w-full mx-auto">
        {activeTab === 'survey' ? (
          <>
            {/* Topographic Statistics */}
            <StatsBar points={points} />

            {/* Base & RN Information Card */}
            <BaseAndRNCard
              base={base}
              rn={rn}
              onUpdateBase={setBase}
              onUpdateRN={setRN}
              onApplyElevationAdjustment={handleApplyElevationAdjustment}
            />

            {/* Main Workspace Grid: Map/Canvas + Table & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Interactive Map/Canvas + Contour Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <TopographyCanvas
                  points={points}
                  base={base}
                  rn={rn}
                  triangles={triangles}
                  contours={contours}
                  settings={settings}
                  onToggleMap={handleToggleMap}
                  onSwapXY={handleSwapXY}
                />

                <ContourControls
                  settings={settings}
                  onChange={setSettings}
                  contoursCount={contours.length}
                  trianglesCount={triangles.length}
                  onSwapXY={handleSwapXY}
                />
              </div>

              {/* Right Column: Spreadsheet of Coordinates & Elevations (5 cols) */}
              <div className="lg:col-span-5 h-[620px]">
                <PointsTable
                  points={points}
                  onUpdatePoint={handleUpdatePoint}
                  onDeletePoint={handleDeletePoint}
                  onAddPoint={handleAddPoint}
                  onSwapXY={handleSwapXY}
                />
              </div>
            </div>
          </>
        ) : (
          <RNDetectorTab
            base={base}
            rn={rn}
            utmZone={settings.utmZone}
            onUpdateBase={setBase}
            onUpdateRN={setRN}
          />
        )}
      </main>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportPoints}
      />
    </div>
  );
}

export default App;
