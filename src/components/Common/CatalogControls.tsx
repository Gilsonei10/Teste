import React from 'react';
import { Category } from '../../types/iptv';
import { SortOption, cleanCategoryName } from '../../utils/mediaUtils';
import { Filter, ArrowUpDown, LayoutGrid, Rows3 } from 'lucide-react';

interface CatalogControlsProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  totalItemsCount: number;
  filteredCount: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'showcase' | 'grid';
  onViewModeChange: (mode: 'showcase' | 'grid') => void;
  themeColor: 'blue' | 'purple';
}

export const CatalogControls: React.FC<CatalogControlsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  totalItemsCount,
  filteredCount,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  themeColor,
}) => {
  const activeColorBg = themeColor === 'purple' ? 'bg-purple-600' : 'bg-blue-600';
  const activeColorShadow = themeColor === 'purple' ? 'shadow-purple-600/30' : 'shadow-blue-600/30';
  const activeColorText = themeColor === 'purple' ? 'text-purple-400' : 'text-blue-400';

  return (
    <div className="space-y-4">
      {/* Top Bar: Controls, Sorting and View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-tv-card/60 p-3 rounded-2xl border border-tv-border">
        {/* Left: Section Summary & View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-tv-surface p-1 rounded-xl border border-tv-border">
            <button
              onClick={() => onViewModeChange('showcase')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'showcase'
                  ? `${activeColorBg} text-white shadow-md ${activeColorShadow}`
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Organizado por Vitrines e Categorias"
            >
              <Rows3 className="w-3.5 h-3.5" />
              <span>Vitrine</span>
            </button>

            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? `${activeColorBg} text-white shadow-md ${activeColorShadow}`
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Exibição em Grade Completa"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grade</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Exibindo <strong className="text-white">{filteredCount}</strong> de {totalItemsCount}
          </span>
        </div>

        {/* Right: Sort Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mr-1">
            <ArrowUpDown className={`w-3.5 h-3.5 ${activeColorText}`} />
            <span>Ordenar por:</span>
          </div>

          <select
            value={sortBy}
            onChange={e => onSortChange(e.target.value as SortOption)}
            className="bg-tv-surface hover:bg-tv-border text-white text-xs font-semibold px-3 py-2 rounded-xl border border-tv-border focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
          >
            <option value="default">🎲 Ordem Original</option>
            <option value="alpha_asc">🔤 Nome (A - Z)</option>
            <option value="alpha_desc">🔤 Nome (Z - A)</option>
            <option value="rating">⭐ Melhores Notas</option>
            <option value="year">📅 Lançamento Mais Recente</option>
          </select>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mr-1 shrink-0">
          <Filter className={`w-4 h-4 ${activeColorText}`} />
          <span>Categorias:</span>
        </div>

        <button
          data-nav="true"
          onClick={() => onSelectCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all outline-none ${
            selectedCategoryId === 'all'
              ? `${activeColorBg} text-white shadow-md ${activeColorShadow} font-bold`
              : 'bg-tv-card hover:bg-tv-border text-slate-300 hover:text-white'
          }`}
        >
          Todas ({totalItemsCount})
        </button>

        {categories.map(cat => {
          const isSelected = selectedCategoryId === cat.id || selectedCategoryId === cat.name;
          const displayName = cleanCategoryName(cat.name);
          return (
            <button
              key={cat.id}
              data-nav="true"
              onClick={() => onSelectCategory(cat.id || cat.name)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all outline-none ${
                isSelected
                  ? `${activeColorBg} text-white shadow-md ${activeColorShadow} font-bold`
                  : 'bg-tv-card hover:bg-tv-border text-slate-300 hover:text-white'
              }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
