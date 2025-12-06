import React, { useState, useMemo } from 'react';
import { Beaker, RotateCcw, Plus, Trash2, Settings2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { LabParameters, CalculationResult, BufferSaltType, BufferConfig } from './types';
import { calculateAdjustment, SALT_DATABASE } from './utils/chemistry';
import { InfoTooltip } from './components/InfoTooltip';
import { StepperInput } from './components/StepperInput';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // Mobile-optimized defaults
  const [params, setParams] = useState<LabParameters>({
    currentPH: 7.0,
    targetPH: 7.4,
    volume: 500,
    volumeUnit: 'mL',
    concentration: 1.0,
    concentrationUnit: 'M',
    empiricalFactor: 1.0,
    buffers: []
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [bufferSectionOpen, setBufferSectionOpen] = useState(true);

  // Derived state: Result
  const result: CalculationResult = useMemo(() => {
    return calculateAdjustment(params);
  }, [params]);

  // Buffer Management
  const addBuffer = () => {
    setParams(prev => ({
      ...prev,
      buffers: [
        ...prev.buffers,
        { id: generateId(), saltType: 'NONE', concentrationGL: 0 }
      ]
    }));
  };

  const removeBuffer = (id: string) => {
    setParams(prev => ({
      ...prev,
      buffers: prev.buffers.filter(b => b.id !== id)
    }));
  };

  const updateBuffer = (id: string, field: keyof BufferConfig, value: any) => {
    setParams(prev => ({
      ...prev,
      buffers: prev.buffers.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const resetAll = () => {
    if(window.confirm('确定重置所有参数吗？')) {
      setParams({
        currentPH: 7.0, targetPH: 7.4, volume: 500, volumeUnit: 'mL', concentration: 1.0, concentrationUnit: 'M', empiricalFactor: 1.0,
        buffers: []
      });
      setIsMenuOpen(false);
    }
  };

  const getReagentColor = () => {
    if (result.reagentType === 'Acid') return 'bg-rose-500';
    if (result.reagentType === 'Base') return 'bg-teal-500';
    return 'bg-slate-400';
  };

  const formatVolume = (vol: number) => {
    if (vol === Infinity) return { val: "---", unit: "" };
    if (vol === 0) return { val: "0", unit: "mL" };
    if (vol < 0.1) return { val: (vol * 1000).toFixed(1), unit: "µL" };
    if (vol < 10) return { val: vol.toFixed(2), unit: "mL" };
    return { val: vol.toFixed(1), unit: "mL" };
  };

  const resultDisplay = formatVolume(result.volumeToAdd);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-40 relative">
      
      {/* 1. Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center safe-area-top">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Beaker size={18} fill="currentColor" fillOpacity={0.2} />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-slate-800">LabPrecision</h1>
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 -mr-2 text-slate-500 active:bg-slate-100 rounded-full"
        >
          <Settings2 size={22} />
        </button>
      </header>

      {/* Settings Modal/Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
           <div className="absolute top-16 right-4 w-64 bg-white rounded-2xl shadow-xl p-4 animate-in slide-in-from-top-4" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="font-semibold text-slate-700">设置</h3>
                <button onClick={() => setIsMenuOpen(false)}><X size={18} className="text-slate-400" /></button>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">重置所有</span>
                    <button onClick={resetAll} className="p-2 bg-slate-100 text-rose-500 rounded-lg hover:bg-rose-50"><RotateCcw size={16}/></button>
                 </div>
                 
                 <div className="space-y-2">
                   <label className="text-sm text-slate-600 block">调节剂浓度单位</label>
                   <div className="flex bg-slate-100 p-1 rounded-lg">
                      {['M', 'mM'].map(unit => (
                        <button 
                          key={unit}
                          onClick={() => setParams(p => ({...p, concentrationUnit: unit as any}))}
                          className={`flex-1 text-xs py-1.5 rounded-md transition-all ${params.concentrationUnit === unit ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-500'}`}
                        >
                          {unit}
                        </button>
                      ))}
                   </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm text-slate-600 flex items-center gap-1">
                        校正系数 (Empirical)
                        <InfoTooltip text="针对含有未知缓冲成分的复杂培养基（如血清），增加此系数以补偿额外消耗。" />
                    </label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="range" min="1" max="3" step="0.1"
                            value={params.empiricalFactor}
                            onChange={(e) => setParams(p => ({...p, empiricalFactor: parseFloat(e.target.value)}))}
                            className="flex-1 h-2 bg-slate-200 rounded-lg accent-indigo-600"
                        />
                        <span className="text-sm font-mono font-bold text-indigo-600 w-8">{params.empiricalFactor.toFixed(1)}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <main className="px-4 pt-6 space-y-6 max-w-lg mx-auto">
        
        {/* 2. Primary Inputs: pH */}
        <section className="space-y-3">
           <div className="flex justify-between items-center">
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">pH 设定</h2>
             {/* Mini visualizer */}
             <div className="w-24 h-1.5 bg-slate-200 rounded-full relative overflow-hidden">
                <div 
                    className="absolute h-full w-2 bg-slate-800 rounded-full transition-all" 
                    style={{ left: `${(params.currentPH / 14) * 100}%` }}
                />
                <div 
                    className="absolute h-full w-2 bg-teal-500 rounded-full transition-all" 
                    style={{ left: `${(params.targetPH / 14) * 100}%` }}
                />
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              <StepperInput 
                label="当前 pH1" 
                value={params.currentPH} 
                onChange={(v) => setParams(p => ({...p, currentPH: v}))}
                min={0} max={14} step={0.1}
              />
              <StepperInput 
                label="目标 pH2" 
                value={params.targetPH} 
                onChange={(v) => setParams(p => ({...p, targetPH: v}))}
                min={0} max={14} step={0.1}
                highlight
              />
           </div>
        </section>

        {/* 3. Solution Specs */}
        <section className="space-y-3">
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">溶液参数</h2>
           <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-3">
                 <StepperInput 
                    className="flex-1"
                    label="总体积"
                    value={params.volume}
                    onChange={(v) => setParams(p => ({...p, volume: v}))}
                    step={params.volume >= 100 ? 50 : 10}
                    unit={params.volumeUnit}
                 />
                 {/* Unit Toggle */}
                 <button 
                    onClick={() => setParams(p => ({...p, volumeUnit: p.volumeUnit === 'mL' ? 'L' : 'mL'}))}
                    className="w-14 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-xs font-bold text-slate-500 active:bg-slate-200"
                 >
                    {params.volumeUnit}
                    <span className="text-[10px] font-normal opacity-50">切换</span>
                 </button>
              </div>

              <StepperInput 
                label={`调节剂浓度 (${params.concentrationUnit})`}
                value={params.concentration}
                onChange={(v) => setParams(p => ({...p, concentration: v}))}
                step={0.5}
                unit={result.reagentType === 'Acid' ? 'HCl' : result.reagentType === 'Base' ? 'KOH' : 'Acid/Base'}
              />
           </div>
           {/* Quick Concentration Presets */}
           <div className="flex gap-2">
              {[0.1, 0.5, 1, 5, 10].map(c => (
                <button 
                    key={c}
                    onClick={() => setParams(p => ({...p, concentration: c}))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${params.concentration === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                    {c}M
                </button>
              ))}
           </div>
        </section>

        {/* 4. Buffer List */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <button 
                onClick={() => setBufferSectionOpen(!bufferSectionOpen)}
                className="w-full p-4 flex items-center justify-between bg-slate-50 border-b border-slate-100 active:bg-slate-100"
            >
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-700">缓冲成分</span>
                    {params.buffers.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {params.buffers.length}
                        </span>
                    )}
                </div>
                {bufferSectionOpen ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
            </button>

            {bufferSectionOpen && (
                <div className="p-4 space-y-3">
                    {params.buffers.length === 0 && (
                        <div className="text-center py-4 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                            暂无缓冲剂
                            <div className="text-xs mt-1 opacity-70">点击下方按钮添加</div>
                        </div>
                    )}
                    
                    {params.buffers.map(buffer => (
                        <div key={buffer.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative animate-in fade-in zoom-in-95 duration-200">
                             <div className="flex justify-between items-start mb-2">
                                <select
                                    value={buffer.saltType}
                                    onChange={(e) => updateBuffer(buffer.id, 'saltType', e.target.value as BufferSaltType)}
                                    className="text-sm font-semibold text-slate-700 bg-transparent outline-none max-w-[80%]"
                                >
                                    <option value="NONE">点击选择物质...</option>
                                    <optgroup label="碳酸盐">
                                        {Object.entries(SALT_DATABASE).filter(([_, v]) => v.system === 'CARBONATE').map(([k, v]) => (
                                            <option key={k} value={k}>{v.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="磷酸盐">
                                        {Object.entries(SALT_DATABASE).filter(([_, v]) => v.system === 'PHOSPHATE').map(([k, v]) => (
                                            <option key={k} value={k}>{v.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="铵盐">
                                        {Object.entries(SALT_DATABASE).filter(([_, v]) => v.system === 'AMMONIUM').map(([k, v]) => (
                                            <option key={k} value={k}>{v.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <button onClick={() => removeBuffer(buffer.id)} className="text-slate-300 hover:text-rose-500 p-1">
                                    <Trash2 size={16} />
                                </button>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={buffer.concentrationGL}
                                            onChange={(e) => updateBuffer(buffer.id, 'concentrationGL', parseFloat(e.target.value))}
                                            className="w-full pl-3 pr-8 py-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="0"
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">g/L</span>
                                    </div>
                                </div>
                                {buffer.saltType !== 'NONE' && (
                                    <div className="text-[10px] text-slate-400 text-right min-w-[3rem]">
                                        <div>MW:{SALT_DATABASE[buffer.saltType].mw.toFixed(0)}</div>
                                        <div className="text-indigo-400 font-mono">
                                            {result.bufferDetails.find(d => d.id === buffer.id)?.molarity ? 
                                                (result.bufferDetails.find(d => d.id === buffer.id)!.molarity * 1000).toFixed(0) + 'mM' 
                                                : ''}
                                        </div>
                                    </div>
                                )}
                             </div>
                        </div>
                    ))}

                    <button 
                        onClick={addBuffer}
                        className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 active:bg-slate-900 active:scale-[0.99] transition-all shadow-md shadow-slate-200"
                    >
                        <Plus size={16} />
                        添加缓冲物质
                    </button>
                </div>
            )}
        </section>

      </main>

      {/* 5. Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-area-bottom z-40 pointer-events-none">
          <div className={`
            max-w-lg mx-auto rounded-2xl shadow-2xl border p-4 flex items-center justify-between pointer-events-auto transition-all duration-300
            ${result.reagentType === 'Acid' ? 'bg-rose-600 border-rose-500 text-white' : 
              result.reagentType === 'Base' ? 'bg-teal-600 border-teal-500 text-white' : 
              'bg-slate-800 border-slate-700 text-slate-300'}
          `}>
             <div>
                <div className="text-xs font-medium opacity-80 uppercase tracking-wide mb-0.5">
                    {result.reagentType === 'None' ? '无需调节' : `添加 ${result.reagentType === 'Acid' ? '酸 (HCl)' : '碱 (KOH)'}`}
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tighter">{resultDisplay.val}</span>
                    <span className="text-sm font-medium opacity-80">{resultDisplay.unit}</span>
                </div>
             </div>

             <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {result.reagentType === 'Acid' ? <span className="font-bold text-lg">H⁺</span> :
                 result.reagentType === 'Base' ? <span className="font-bold text-lg">OH⁻</span> :
                 <span className="text-lg">--</span>}
             </div>
          </div>
      </div>

    </div>
  );
};

export default App;